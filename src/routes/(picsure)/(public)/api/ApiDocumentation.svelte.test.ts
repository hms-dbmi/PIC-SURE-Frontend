// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { flushSync } from 'svelte';

const { SwaggerUI, mockPage } = vi.hoisted(() => ({
  SwaggerUI: vi.fn(),
  mockPage: { url: new URL('https://picsure.test/api'), state: {} },
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn((type: string, action: string, metadata: unknown) => ({
    type,
    action,
    metadata,
  })),
}));
vi.mock('#lib/auth/session.svelte.ts', () => {
  class MockSession {
    isLoggedIn = $state(false);
  }
  return { session: new MockSession() };
});
vi.mock('$app/state', () => ({ page: mockPage }));
vi.mock('$app/navigation', () => ({ replaceState: vi.fn() }));
vi.mock('swagger-ui-dist/swagger-ui-bundle.js', () => ({ default: SwaggerUI }));
vi.mock('swagger-ui-dist/swagger-ui.css', () => ({}));

import { replaceState } from '$app/navigation';
import { session } from '#lib/auth/session.svelte.ts';
import { log } from '#lib/telemetry/logger.ts';
import ApiDocumentation from './ApiDocumentation.svelte';

// The mock above gives the session a settable isLoggedIn.
const mockSession = session as { isLoggedIn: boolean };
const allServices = ['hpds-open-access', 'hpds-query-service', 'dictionary'];

const document31 = { openapi: '3.1.0', info: { title: 'Docs', version: '1' }, paths: {} };

// Serves the registry with the given services, and an OpenAPI document for each of them.
function serve(names: string[]) {
  const fetchMock = vi.fn(async (path: string) => {
    const body = path === '/picsure/openapi' ? names.map((name) => ({ name })) : document31;
    return new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// happy-dom (20.10.6) holds a MutationObserver's callback only through a WeakRef, so any garbage
// collection silently stops it. The tests swap in this observer and report each DOM change to it
// themselves. It only knows child-list changes.
const observers = new Set<ReportedObserver>();
class ReportedObserver {
  #targets: { node: Node; options: MutationObserverInit }[] = [];
  constructor(readonly callback: MutationCallback) {}
  observe(node: Node, options?: MutationObserverInit) {
    this.#targets.push({ node, options: options ?? {} });
    observers.add(this);
  }
  disconnect() {
    this.#targets = [];
    observers.delete(this);
  }
  takeRecords() {
    return [];
  }
  watchesChildrenOf(parent: Node) {
    return this.#targets.some(
      ({ node, options }) =>
        options.childList && (node === parent || (options.subtree && node.contains(parent))),
    );
  }
}

// Changes parent's children, then synchronously calls back each observer watching them.
function changeChildren(parent: Element, change: () => void) {
  change();
  const record: Partial<MutationRecord> = { type: 'childList', target: parent };
  for (const observer of observers) {
    if (observer.watchesChildrenOf(parent)) {
      observer.callback([record as MutationRecord], observer as MutationObserver);
    }
  }
}

// Stands in for the Swagger bundle: runs the plugins and draws headings like Swagger does.
function drawSwagger() {
  SwaggerUI.mockImplementation(({ domNode, plugins }) => {
    const React = { createElement: vi.fn(), useLayoutEffect: vi.fn(), useState: vi.fn() };
    for (const plugin of plugins) plugin({ React });
    changeChildren(domNode, () => {
      domNode.innerHTML = `
        <div class="info"><h2 class="title">Docs</h2></div>
        <h3 class="opblock-tag">Search</h3>
        <div class="opblock"><h4>Parameters</h4></div>`;
    });
    return { specActions: { updateSpec: vi.fn() } };
  });
}

function fetchedDocuments(fetchMock: ReturnType<typeof serve>) {
  return fetchMock.mock.calls
    .map(([path]) => path)
    .filter((path) => path.startsWith('/picsure/openapi/'))
    .map((path) => path.slice('/picsure/openapi/'.length));
}

function serviceSelections() {
  return vi
    .mocked(log)
    .mock.calls.map(([entry]) => entry as unknown as { action: string; metadata: unknown })
    .filter(({ action }) => action === 'api.docs_service_select')
    .map(({ metadata }) => metadata);
}

function writtenUrls() {
  return vi.mocked(replaceState).mock.calls.map(([url]) => String(url));
}

function announcement() {
  return screen.getByTestId('api-docs-announcement').textContent?.trim();
}

function level(selector: string) {
  return document.querySelector(selector)?.getAttribute('aria-level');
}

describe('ApiDocumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.isLoggedIn = true;
    mockPage.url = new URL('https://picsure.test/api');
    SwaggerUI.mockReset();
    drawSwagger();
    observers.clear();
    vi.stubGlobal('MutationObserver', ReportedObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('offers every documented service as a tab, with the dictionary selected first', async () => {
    const fetchMock = serve(allServices);
    render(ApiDocumentation);

    const tablist = await screen.findByRole('tablist', { name: 'API documentation by service' });
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'Dictionary',
      'Authorized Queries',
      'Open Queries',
    ]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(fetchedDocuments(fetchMock)).toEqual(['dictionary']));
    expect(screen.getByRole('tabpanel', { name: 'Dictionary' })).toContainElement(
      document.querySelector('.swagger-host') as HTMLElement,
    );
    // The first document isn't a change, so nothing is announced and the address is left alone.
    expect(announcement()).toBe('');
    expect(writtenUrls()).toEqual([]);
  });

  it('hides the authorized queries from visitors who are not signed in', async () => {
    mockSession.isLoggedIn = false;
    const fetchMock = serve(allServices);
    render(ApiDocumentation);

    const tablist = await screen.findByRole('tablist');
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((tab) => tab.textContent?.trim()),
    ).toEqual(['Dictionary', 'Open Queries']);
    await waitFor(() => expect(fetchedDocuments(fetchMock)).toEqual(['dictionary']));
  });

  it('shows the chosen tab, records it in the address and announces it once drawn', async () => {
    const fetchMock = serve(allServices);
    render(ApiDocumentation);
    await waitFor(() => expect(SwaggerUI).toHaveBeenCalled());

    await fireEvent.click(screen.getByRole('tab', { name: 'Open Queries' }));

    await waitFor(() => expect(announcement()).toBe('Showing the Open Queries API documentation.'));
    expect(fetchedDocuments(fetchMock)).toEqual(['dictionary', 'hpds-open-access']);
    expect(screen.getByRole('tab', { name: 'Open Queries' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel', { name: 'Open Queries' })).toBeTruthy();
    expect(writtenUrls()).toEqual(['https://picsure.test/api?service=hpds-open-access#api-access']);
    expect(serviceSelections()).toEqual([
      { from: 'dictionary', to: 'hpds-open-access', source: 'tab' },
    ]);
  });

  it('opens on the service a link names', async () => {
    mockPage.url = new URL('https://picsure.test/api?service=hpds-open-access#api-access');
    const fetchMock = serve(allServices);
    render(ApiDocumentation);

    await waitFor(() => expect(fetchedDocuments(fetchMock)).toEqual(['hpds-open-access']));
    expect(screen.getByRole('tab', { name: 'Open Queries' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(serviceSelections()).toEqual([{ to: 'hpds-open-access', source: 'url' }]);
    expect(writtenUrls()).toEqual([]);
  });

  for (const [why, service] of [
    ['a service hidden from visitors who are not signed in', 'hpds-query-service'],
    ['a service the registry does not list', 'visualization'],
  ]) {
    it(`opens on the dictionary and drops a link to ${why}`, async () => {
      mockSession.isLoggedIn = false;
      mockPage.url = new URL(`https://picsure.test/api?q=1&service=${service}#api-access`);
      const fetchMock = serve(allServices.filter((name) => name !== 'hpds-open-access'));
      render(ApiDocumentation);

      await waitFor(() => expect(fetchedDocuments(fetchMock)).toEqual(['dictionary']));
      expect(writtenUrls()).toEqual(['https://picsure.test/api?q=1#api-access']);
      expect(serviceSelections()).toEqual([]);
    });
  }

  it('shows a single service without tabs', async () => {
    mockSession.isLoggedIn = false;
    const fetchMock = serve(['dictionary', 'hpds-query-service']);
    render(ApiDocumentation);

    await waitFor(() => expect(fetchedDocuments(fetchMock)).toEqual(['dictionary']));
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });

  it('moves to the dictionary when the visitor signs out on the authorized queries', async () => {
    const fetchMock = serve(allServices);
    render(ApiDocumentation);
    await waitFor(() => expect(SwaggerUI).toHaveBeenCalled());
    await fireEvent.click(screen.getByRole('tab', { name: 'Authorized Queries' }));
    await waitFor(() =>
      expect(announcement()).toBe('Showing the Authorized Queries API documentation.'),
    );
    const host = document.querySelector('.swagger-host');

    mockSession.isLoggedIn = false;
    flushSync();

    await waitFor(() => expect(announcement()).toBe('Showing the Dictionary API documentation.'));
    expect(screen.queryByRole('tab', { name: 'Authorized Queries' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Dictionary' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(fetchedDocuments(fetchMock)).toEqual(['dictionary', 'hpds-query-service', 'dictionary']);
    expect(serviceSelections().at(-1)).toEqual({
      from: 'hpds-query-service',
      to: 'dictionary',
      source: 'session',
    });
    // Swagger's host stays put, so the viewer keeps drawing into it.
    expect(document.querySelector('.swagger-host')).toBe(host);
  });

  it('announces a document that fails to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) =>
        path === '/picsure/openapi'
          ? new Response(JSON.stringify([{ name: 'dictionary' }]), { status: 200 })
          : new Response('', { status: 502 }),
      ),
    );
    render(ApiDocumentation);

    await waitFor(() =>
      expect(announcement()).toBe('Unable to load API documentation. Please try again.'),
    );
  });

  it('falls back to the first documented service without the dictionary', async () => {
    const fetchMock = serve(['hpds-open-access', 'hpds-query-service']);
    render(ApiDocumentation);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/picsure/openapi/hpds-query-service',
        expect.anything(),
      ),
    );
  });

  it("nests Swagger's headings under the page's level 2 heading", async () => {
    serve(['dictionary']);
    render(ApiDocumentation);

    await waitFor(() => expect(level('.info .title')).toBe('3'));
    expect(level('.opblock-tag')).toBe('4');
    expect(level('.opblock h4')).toBe('5');

    // Swagger adds headings as sections expand; they are leveled as they appear.
    const operation = document.querySelector('.opblock')!;
    const responses = document.createElement('h4');
    responses.id = 'responses';
    changeChildren(operation, () => operation.append(responses));
    expect(level('#responses')).toBe('5');
  });

  it('stops leveling headings once removed', async () => {
    serve(['dictionary']);
    const { unmount } = render(ApiDocumentation);
    await waitFor(() => expect(level('.info .title')).toBe('3'));
    const host = document.querySelector('.swagger-host')!;

    unmount();
    const heading = document.createElement('h3');
    heading.className = 'opblock-tag';
    changeChildren(host, () => host.append(heading));
    expect(heading.hasAttribute('aria-level')).toBe(false);
  });
});

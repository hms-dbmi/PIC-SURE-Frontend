// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

const { SwaggerUI } = vi.hoisted(() => ({ SwaggerUI: vi.fn() }));

vi.mock('#lib/telemetry/logger.ts', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('swagger-ui-dist/swagger-ui-bundle.js', () => ({ default: SwaggerUI }));
vi.mock('swagger-ui-dist/swagger-ui.css', () => ({}));

import ApiDocumentation from './ApiDocumentation.svelte';

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

function level(selector: string) {
  return document.querySelector(selector)?.getAttribute('aria-level');
}

describe('ApiDocumentation', () => {
  beforeEach(() => {
    SwaggerUI.mockReset();
    drawSwagger();
    observers.clear();
    vi.stubGlobal('MutationObserver', ReportedObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the dictionary first when every service is documented', async () => {
    const fetchMock = serve(['hpds-open-access', 'hpds-query-service', 'dictionary']);
    render(ApiDocumentation);

    const select = await screen.findByLabelText('Select service:');
    expect(Array.from((select as HTMLSelectElement).options, (option) => option.text)).toEqual([
      'Dictionary',
      'Authorized Queries',
      'Open Queries',
    ]);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/picsure/openapi/dictionary', expect.anything()),
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

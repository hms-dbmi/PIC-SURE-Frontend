// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { AfterNavigate } from '@sveltejs/kit';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: vi.fn() }));
const { mockPage } = vi.hoisted(() => ({
  mockPage: { url: new URL('https://example.org/api') },
}));
vi.mock('$app/state', () => ({ page: mockPage }));

import { afterNavigate, goto } from '$app/navigation';
import OnThisPage, { type TocEntry } from '$lib/components/toc/OnThisPage.svelte';

const entries: TocEntry[] = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'choose-your-workflow', label: 'Choose Your Workflow' },
  { id: 'api-access', label: 'API Documentation' },
];

class ControlledResizeObserver {
  static instances: ControlledResizeObserver[] = [];
  targets = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {
    ControlledResizeObserver.instances.push(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
  static resize(target: Element) {
    for (const observer of this.instances) {
      if (observer.targets.has(target)) {
        observer.callback(
          [{ target } as ResizeObserverEntry],
          observer as unknown as ResizeObserver,
        );
      }
    }
  }
}

let scroller: HTMLElement;
let clientHeight: number;
let scrollHeight: number;
let positions: Map<string, { top: number; height: number }>;
let navigations: Array<Parameters<typeof afterNavigate>[0]>;
const scrollerTop = 80;

function target(id: string) {
  return document.getElementById(id)!;
}

function heading(id: string) {
  return target(id).querySelector('h2')!;
}

function mockScrollIntoView(id: string) {
  return vi.spyOn(target(id), 'scrollIntoView').mockImplementation(() => {
    scroller.scrollTop = positions.get(id)!.top;
    scroller.dispatchEvent(new Event('scroll'));
  });
}

function expectDestination(path: string) {
  expect(goto).toHaveBeenCalledTimes(1);
  const [destination, options] = vi.mocked(goto).mock.calls[0];
  expect(new URL(String(destination), mockPage.url).href).toBe(new URL(path, mockPage.url).href);
  expect(options).toEqual({ noScroll: true, keepFocus: true });
}

function link(id: string) {
  return screen.getByRole('link', { name: entries.find((entry) => entry.id === id)!.label });
}

function expectCurrent(id: string) {
  const current = screen
    .getByRole('navigation', { name: 'On this page' })
    .querySelectorAll('a[aria-current="true"]');
  expect(current).toHaveLength(1);
  expect(current[0]).toHaveAttribute('href', `#${id}`);
}

async function scrollTo(top: number) {
  scroller.scrollTop = top;
  await fireEvent.scroll(scroller);
}

async function navigate(url: string, type: AfterNavigate['type'] = 'popstate') {
  mockPage.url = new URL(url, 'https://example.org');
  for (const callback of navigations) {
    await callback({ type, to: { url: mockPage.url } } as AfterNavigate);
  }
  await tick();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(goto).mockResolvedValue();
  navigations = [];
  vi.mocked(afterNavigate).mockImplementation((callback) => {
    navigations.push(callback);
  });
  mockPage.url = new URL('https://example.org/api');
  ControlledResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', ControlledResizeObserver);

  clientHeight = 800;
  scrollHeight = 3000;
  positions = new Map([
    ['hero', { top: 0, height: 240 }],
    ['api-header', { top: 32, height: 80 }],
    ['authentication', { top: 240, height: 500 }],
    ['choose-your-workflow', { top: 740, height: 650 }],
    ['api-access', { top: 1390, height: 1500 }],
  ]);
  scroller = document.createElement('main');
  scroller.id = 'page';
  scroller.innerHTML = `
    <header id="hero"><h1 id="api-header">API</h1></header>
    <section id="authentication"><h2>Authentication</h2></section>
    <section id="choose-your-workflow"><h2>Choose Your Workflow</h2></section>
    <section id="api-access"><h2>API Documentation</h2></section>
  `;
  document.body.append(scroller);
  Object.defineProperties(scroller, {
    clientHeight: { get: () => clientHeight, configurable: true },
    scrollHeight: { get: () => scrollHeight, configurable: true },
  });
  vi.spyOn(scroller, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, scrollerTop, 1000, clientHeight),
  );
  for (const [id] of positions) {
    vi.spyOn(target(id), 'getBoundingClientRect').mockImplementation(() => {
      const { top, height } = positions.get(id)!;
      return new DOMRect(0, scrollerTop + top - scroller.scrollTop, 1000, height);
    });
  }
});

afterEach(() => {
  cleanup();
  scroller.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('OnThisPage scroll tracking', () => {
  it('labels the navigation and starts with Authentication while the hero is visible', () => {
    render(OnThisPage, { entries });

    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((anchor) => anchor.textContent)).toEqual(
      entries.map((entry) => entry.label),
    );
    expect(screen.queryByRole('link', { name: 'Overview' })).not.toBeInTheDocument();
    expectCurrent('authentication');
  });

  it('keeps Authentication selected while the hero remains visible below the top', async () => {
    positions.set('choose-your-workflow', { top: 300, height: 600 });
    scroller.scrollTop = 150;
    render(OnThisPage, { entries });

    expectCurrent('authentication');
    await scrollTo(241);
    expectCurrent('choose-your-workflow');
  });

  it('switches sections at the 40% line relative to the scroller', async () => {
    render(OnThisPage, { entries });

    await scrollTo(419);
    expectCurrent('authentication');
    await scrollTo(420);
    expectCurrent('choose-your-workflow');
    await scrollTo(1069);
    expectCurrent('choose-your-workflow');
    await scrollTo(1070);
    expectCurrent('api-access');
    await scrollTo(419);
    expectCurrent('authentication');
  });

  it('prioritizes the top rule through scrollTop 4 even when later sections cross the line', async () => {
    positions.set('hero', { top: -500, height: 100 });
    positions.set('api-header', { top: -500, height: 80 });
    positions.set('authentication', { top: 0, height: 100 });
    positions.set('choose-your-workflow', { top: 100, height: 100 });
    positions.set('api-access', { top: 200, height: 100 });
    render(OnThisPage, { entries });

    expectCurrent('authentication');
    await scrollTo(4);
    expectCurrent('authentication');
    await scrollTo(5);
    expectCurrent('api-access');
  });

  it('selects the last entry at a scrollable bottom even if it cannot reach the threshold', async () => {
    positions.set('api-access', { top: 2900, height: 100 });
    render(OnThisPage, { entries });

    await scrollTo(2100);
    expectCurrent('choose-your-workflow');
    await scrollTo(scrollHeight - clientHeight);
    expectCurrent('api-access');
    await scrollTo(0);
    expectCurrent('authentication');
  });

  it('keeps the first entry on a page without overflow, including almost-fitting content', async () => {
    scrollHeight = clientHeight;
    const { rerender } = render(OnThisPage, { entries });
    expectCurrent('authentication');

    scrollHeight = clientHeight + 2;
    await rerender({ entries: [...entries] });
    await scrollTo(2);
    expectCurrent('authentication');
  });

  it('recalculates when a section expands without a scroll event', async () => {
    scroller.scrollTop = 500;
    render(OnThisPage, { entries });
    expectCurrent('choose-your-workflow');

    positions.set('choose-your-workflow', { top: 1000, height: 650 });
    ControlledResizeObserver.resize(target('authentication'));
    await tick();
    expectCurrent('authentication');
  });

  it('recalculates when the scroller height changes', async () => {
    scroller.scrollTop = 400;
    render(OnThisPage, { entries });
    expectCurrent('authentication');

    clientHeight = 1000;
    ControlledResizeObserver.resize(scroller);
    await tick();
    expectCurrent('choose-your-workflow');
  });

  it('recalculates on window resize and when content growth moves the bottom', async () => {
    positions.set('api-access', { top: 2900, height: 100 });
    scroller.scrollTop = 2200;
    render(OnThisPage, { entries });
    expectCurrent('api-access');

    scrollHeight = 4000;
    await fireEvent(window, new Event('resize'));
    expectCurrent('choose-your-workflow');
  });

  it('updates tracking and resize observation when entries change', async () => {
    scroller.scrollTop = 1100;
    const { rerender } = render(OnThisPage, { entries: entries.slice(0, 2) });
    expectCurrent('choose-your-workflow');

    await rerender({ entries });
    expectCurrent('api-access');
    positions.set('api-access', { top: 1800, height: 500 });
    ControlledResizeObserver.resize(target('api-access'));
    await tick();
    expectCurrent('choose-your-workflow');

    await rerender({ entries: [] });
    expect(
      ControlledResizeObserver.instances.every((observer) => observer.targets.size === 0),
    ).toBe(true);
    await scrollTo(2200);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    await rerender({ entries: [entries[0]] });
    expectCurrent('authentication');
  });

  it('handles empty entries at mount and after scrolling or resizing', async () => {
    render(OnThisPage, { entries: [] });
    await scrollTo(2200);
    ControlledResizeObserver.resize(scroller);
    await fireEvent(window, new Event('resize'));

    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('skips missing section targets during tracking', async () => {
    target('choose-your-workflow').remove();
    render(OnThisPage, { entries });

    await scrollTo(500);
    expectCurrent('authentication');
    await scrollTo(1070);
    expectCurrent('api-access');
  });

  it('renders safely without the page scroller', () => {
    scroller.remove();
    render(OnThisPage, { entries });
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('disconnects observers and scroll/resize listeners on unmount', async () => {
    const { unmount } = render(OnThisPage, { entries });
    expect(
      ControlledResizeObserver.instances.some((observer) => observer.targets.has(scroller)),
    ).toBe(true);
    await unmount();

    expect(
      ControlledResizeObserver.instances.every((observer) => observer.targets.size === 0),
    ).toBe(true);
    vi.mocked(target('authentication').getBoundingClientRect).mockClear();
    vi.mocked(scroller.getBoundingClientRect).mockClear();
    await scrollTo(500);
    await fireEvent(window, new Event('resize'));
    expect(target('authentication').getBoundingClientRect).not.toHaveBeenCalled();
    expect(scroller.getBoundingClientRect).not.toHaveBeenCalled();
  });
});

describe('OnThisPage navigation', () => {
  it('preserves the current pathname and query, scrolls the section, and focuses its heading', async () => {
    mockPage.url = new URL('https://example.org/custom/docs?tab=api&filter=a%20b#authentication');
    const onselect = vi.fn();
    const scroll = mockScrollIntoView('choose-your-workflow');
    const focus = vi.spyOn(heading('choose-your-workflow'), 'focus');
    render(OnThisPage, { entries, onselect });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    await fireEvent(link('choose-your-workflow'), event);

    expect(event.defaultPrevented).toBe(true);
    expectDestination('/custom/docs?tab=api&filter=a%20b#choose-your-workflow');
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(heading('choose-your-workflow')).toHaveAttribute('tabindex', '-1');
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(heading('choose-your-workflow'));
    expectCurrent('choose-your-workflow');
    expect(onselect).toHaveBeenCalledExactlyOnceWith('choose-your-workflow');
  });

  it.each([
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ])('leaves modified or non-primary clicks to native navigation (%j)', async (modifiers) => {
    const onselect = vi.fn();
    const scroll = vi.spyOn(target('api-access'), 'scrollIntoView');
    render(OnThisPage, { entries, onselect });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });
    await fireEvent(link('api-access'), event);

    expect(event.defaultPrevented).toBe(false);
    expect(goto).not.toHaveBeenCalled();
    expect(onselect).not.toHaveBeenCalled();
    expect(scroll).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(heading('api-access'));
    expectCurrent('authentication');
  });

  it('handles a selected entry whose target is missing without attempting to focus it', async () => {
    target('api-access').remove();
    render(OnThisPage, { entries });
    await fireEvent.click(link('api-access'));

    expectDestination('/api#api-access');
    expect(document.activeElement?.tagName).not.toBe('H2');
  });

  it('does not handle a click that another listener already prevented', async () => {
    const onselect = vi.fn();
    render(OnThisPage, { entries, onselect });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    event.preventDefault();
    await fireEvent(link('api-access'), event);

    expect(goto).not.toHaveBeenCalled();
    expect(onselect).not.toHaveBeenCalled();
    expectCurrent('authentication');
  });

  it('revisits matching hash targets and heading focus on Back/Forward without logging a click', async () => {
    const onselect = vi.fn();
    const workflowScroll = mockScrollIntoView('choose-your-workflow');
    const authScroll = mockScrollIntoView('authentication');
    render(OnThisPage, { entries, onselect });
    expect(afterNavigate).toHaveBeenCalled();

    await navigate('/api?source=docs#choose-your-workflow');
    expect(workflowScroll).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(heading('choose-your-workflow'));
    expectCurrent('choose-your-workflow');

    await navigate('/api?source=docs#authentication');
    expect(authScroll).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(heading('authentication'));
    expectCurrent('authentication');
    expect(goto).not.toHaveBeenCalled();
    expect(onselect).not.toHaveBeenCalled();
  });

  it('ignores history hashes outside the entries and safely handles a missing hash target', async () => {
    const scroll = vi.spyOn(target('authentication'), 'scrollIntoView');
    render(OnThisPage, { entries });

    await navigate('/api');
    await navigate('/api#unknown');
    target('api-access').remove();
    await navigate('/api#api-access');

    expect(scroll).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(document.activeElement?.tagName).not.toBe('H2');
  });
});

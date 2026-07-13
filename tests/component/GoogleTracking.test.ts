// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('$app/state', () => ({
  page: { url: new URL('http://localhost/explorer') },
}));

// Capture the afterNavigate callback the component registers so tests can fire
// navigations. The holder is created via vi.hoisted so the hoisted vi.mock
// factory below can reference it.
const navigation = vi.hoisted(() => ({
  cb: undefined as ((nav: { type: string }) => void) | undefined,
}));

vi.mock('$app/navigation', () => ({
  afterNavigate: (cb: (nav: { type: string }) => void) => {
    navigation.cb = cb;
  },
}));

// Analytics-only configuration (no tag manager) — also guards the regression
// where the consent prompt was coupled to `tagManager` being set. The literal
// must be inlined here because vi.mock factories are hoisted above module vars.
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    settings: { google: { analytics: 'G-TEST123', tagManager: '' } },
    branding: { privacyPolicy: { url: 'https://example.org/privacy', title: 'Privacy Policy' } },
  },
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
}));

import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
import { page } from '$app/state';

const ANALYTICS_ID = 'G-TEST123';

// page.url is readonly on the real type; cast to mutate the mock between navigations.
function setRoute(pathname: string) {
  (page as unknown as { url: URL }).url = new URL(`http://localhost${pathname}`);
}

function pageViewEvents(): Command[] {
  return dataLayer().filter((e) => e[0] === 'event' && e[1] === 'page_view');
}

type Command = IArguments & Record<number, unknown>;

function dataLayer(): Command[] {
  return (window.dataLayer ?? []) as Command[];
}

function findCommand(name: string, sub?: string): Command | undefined {
  return dataLayer().find((entry) => entry[0] === name && (sub === undefined || entry[1] === sub));
}

// Capture injected scripts without actually connecting them to the document —
// happy-dom would otherwise attempt to fetch gtag.js.
let injectedScripts: HTMLScriptElement[] = [];

beforeEach(() => {
  injectedScripts = [];
  vi.spyOn(document.head, 'insertBefore').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLScriptElement) injectedScripts.push(node);
    return node;
  });

  window.dataLayer = [];
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GoogleTracking', () => {
  it('initializes analytics on mount even without prior consent (regression: May 2025 gating)', () => {
    render(GoogleTracking);

    const config = findCommand('config');
    expect(config, 'expected a gtag config command queued on mount').toBeDefined();
    expect(config?.[1]).toBe(ANALYTICS_ID);

    // gtag.js must be injected regardless of consent state (Consent Mode handles
    // granted/denied), and independently of whether a tag manager is configured.
    const analytics = injectedScripts.find((script) => script.id === 'analytics');
    expect(analytics, 'expected the analytics gtag.js script to be injected').toBeDefined();
    expect(analytics?.src).toContain(ANALYTICS_ID);
  });

  it('pushes the arguments object, not a plain array (regression: Nov 2025 push(args))', () => {
    render(GoogleTracking);

    const entries = dataLayer();
    expect(entries.length).toBeGreaterThan(0);
    // gtag.js silently ignores plain arrays — every queued command must be an
    // Arguments object.
    for (const entry of entries) {
      expect(Array.isArray(entry)).toBe(false);
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
    }
  });

  it('sends a consent "update" (not a re-init) when the user accepts', async () => {
    render(GoogleTracking);

    const analyticsScriptsBefore = injectedScripts.filter((s) => s.id === 'analytics').length;

    await fireEvent.click(screen.getByTestId('acceptGoogleConsent'));

    const update = findCommand('consent', 'update');
    expect(update, 'expected a consent "update" command after Accept').toBeDefined();
    expect(update?.[2]).toMatchObject({
      analytics_storage: 'granted',
      personalization_storage: 'granted',
    });

    // Accepting must not re-run initialize() and double-inject gtag.js.
    expect(injectedScripts.filter((s) => s.id === 'analytics').length).toBe(analyticsScriptsBefore);
  });

  it('falls back to deny-all without throwing when stored consent is malformed JSON', () => {
    localStorage.setItem('consentMode', '{ this is : not json');

    // Root-layout component: a JSON.parse throw here would break hydration.
    expect(() => render(GoogleTracking)).not.toThrow();

    const consentDefault = findCommand('consent', 'default');
    expect(consentDefault, 'expected a consent default command').toBeDefined();
    expect(consentDefault?.[2]).toMatchObject({
      analytics_storage: 'denied',
      personalization_storage: 'denied',
    });

    // Tracking still initializes despite the bad stored value...
    expect(findCommand('config')).toBeDefined();
    // ...and a malformed value is treated as "no valid consent", so we re-prompt.
    expect(screen.queryByTestId('consentModal')).not.toBeNull();
  });

  it('falls back to deny-all without throwing when localStorage access is blocked', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    // Blocked storage (sandbox/private mode) must not crash mount.
    expect(() => render(GoogleTracking)).not.toThrow();

    expect(findCommand('config'), 'tracking must still initialize').toBeDefined();
    expect(findCommand('consent', 'default')?.[2]).toMatchObject({ analytics_storage: 'denied' });
  });

  it('does not throw when persisting consent is blocked on accept', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    render(GoogleTracking);

    // Should not throw even though setItem is blocked; if updateConsent rethrew,
    // the click handler would reject and this await would fail the test.
    await fireEvent.click(screen.getByTestId('acceptGoogleConsent'));

    // The choice still applies for the session via a consent update.
    const update = findCommand('consent', 'update');
    expect(update, 'expected a consent update even when persistence fails').toBeDefined();
    expect(update?.[2]).toMatchObject({ analytics_storage: 'granted' });
  });

  it('sends a page_view on client-side navigation (regression: SPA nav untracked)', () => {
    setRoute('/explorer');
    render(GoogleTracking);

    // Initial load is tracked via gtag('config', …); no page_view event yet.
    expect(pageViewEvents().length).toBe(0);

    // Navigate client-side to a new route and let SvelteKit complete it.
    setRoute('/dataset/42');
    navigation.cb?.({ type: 'goto' });

    const events = pageViewEvents();
    expect(events.length).toBe(1);
    expect(events[0][2]).toMatchObject({ page_path: '/dataset/42' });
  });

  it('does not double-count the initial load (skips the "enter" navigation)', () => {
    setRoute('/explorer');
    render(GoogleTracking);

    // 'enter' is the initial mount, already counted by gtag('config', …).
    navigation.cb?.({ type: 'enter' });

    expect(pageViewEvents().length).toBe(0);
  });
});

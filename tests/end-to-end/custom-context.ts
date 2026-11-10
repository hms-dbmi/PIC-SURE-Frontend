import { readFileSync } from 'node:fs';
import { test as base, expect, type Route, type BrowserContext, type Page } from '@playwright/test';
import type { PlaywrightTestOptions, TestInfo } from '@playwright/test';
import type { ConfigCache } from '../../src/lib/config/resolve';
import type { ExpectedResultType } from '../../src/lib/query/query';
import { TEST_CONFIG_COOKIE } from '../../src/lib/config/testOverride';
import * as mockData from '../support/mock-data';
import { configurationPath } from '../support/mock-data';

// Fixtures are shared by every test in a worker, so a test that mutates one silently changes
// what later tests see. Freeze them so a mutation throws where it happens instead; spread a
// copy (`{ ...picsureUser, token }`) to customise one.
function deepFreeze(value: unknown) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
}
Object.values(mockData).forEach(deepFreeze);

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mockApiSuccess(context: BrowserContext | Page, path: string, json: any) {
  return context.route(path, async (route: Route) => route.fulfill({ json }));
}

export function mockApiSuccessByMethod(
  context: BrowserContext | Page,
  path: string,
  method: string,
  json: any,
) {
  return context.route(path, async (route: Route) => {
    if (route.request().method() === method) {
      await route.fulfill({ json });
      return;
    }
    await route.fallback();
  });
}

// HPDS answers every query on one endpoint and decides what to return from the request's
// expectedResultType. Give the response per type; a type the test didn't list falls through
// to the fixture's unmocked-call check, which fails the test and names the type. An Error
// value aborts that type's request instead.
export function mockQuerySync(
  context: BrowserContext | Page,
  results: Partial<Record<ExpectedResultType, unknown>>,
  access: 'auth' | 'open' = 'auth',
) {
  return context.route(`*/**/picsure/hpds/${access}/query/sync`, (route: Route) => {
    const type: ExpectedResultType = route.request().postDataJSON()?.query?.expectedResultType;
    if (!(type in results)) return route.fallback();
    const result = results[type];
    return result instanceof Error ? route.abort('failed') : route.fulfill({ json: result });
  });
}

function pagePathname(route: Route): string | undefined {
  try {
    return new URL(route.request().frame().url()).pathname;
  } catch {
    // Service worker requests have no frame
    return undefined;
  }
}

export function mockApiFail(
  context: BrowserContext | Page,
  path: string,
  message:
    | 'aborted'
    | 'accessdenied'
    | 'addressunreachable'
    | 'blockedbyclient'
    | 'blockedbyresponse'
    | 'connectionaborted'
    | 'connectionclosed'
    | 'connectionfailed'
    | 'connectionrefused'
    | 'connectionreset'
    | 'internetdisconnected'
    | 'namenotresolved'
    | 'timedout'
    | 'failed',
) {
  return context.route(path, (route: Route) => route.abort(message));
}

export function mockHTMLBodySuccess(context: Page, path: string | RegExp, body: string) {
  return context.route(path, async (route: Route) => route.fulfill({ body }));
}

/**
 * The `/login/loading` URL Auth0 sends the user back to after a login. Seeds the login state the
 * tab saves on its way out (the fixture already seeds `type=AUTH0`), so the callback is accepted.
 */
export async function auth0Callback(page: Page): Promise<string> {
  const state = 'mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G';
  await page.addInitScript((state) => {
    if (location.pathname.startsWith('/login/loading')) sessionStorage.setItem('loginState', state);
  }, state);
  return (
    `/login/loading/#access_token=${mockData.mockToken}` +
    `&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=${state}`
  );
}

/**
 * Answers PSAMA the way it answers a signed-in user who hasn't accepted the latest terms: a 403 with
 * an empty body (see `termsRefusal` in src/lib/api/client.ts) to every request that carries their
 * token, except `/tos/accept` and `/logout` (which Spring Security's logout filter answers first).
 * After `/tos/accept`, PSAMA requests fall through to the test's routes.
 */
export function mockTermsNotAccepted(context: BrowserContext | Page) {
  let accepted = false;
  return context.route('*/**/psama/**', (route: Route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('/psama/tos/accept')) {
      accepted = true;
      return route.fulfill({ status: 200, body: '' });
    }
    const carriesToken = route.request().headers()['authorization'] !== undefined;
    if (accepted || !carriesToken || pathname.endsWith('/psama/logout')) return route.fallback();
    return route.fulfill({ status: 403, body: '' });
  });
}

/**
 * A saved login state without its stored profile, so the app starts from the token alone, as in a
 * fresh tab. Read when the test runs: the setup project writes the file after test modules load.
 */
export function tokenOnlyState(file: string) {
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures must destructure their first argument
  return async ({}, use: (state: StorageState) => Promise<void>) => {
    const state = JSON.parse(readFileSync(file, 'utf-8')) as StorageState;
    for (const origin of state.origins) {
      origin.localStorage = origin.localStorage.filter(({ name }) => name !== 'user');
    }
    await use(state);
  };
}

// SSR resolves config server-side (see src/routes/+layout.server.ts), so it's no
// longer visible to Playwright as a browser-level fetch to mock. Instead, seed a
// cookie that +layout.server.ts reads (only in test mode) to override the config
// for this BrowserContext's requests only - safe under fullyParallel workers since
// each context has its own isolated cookie jar.
export async function mockApiConfig(
  context: BrowserContext | Page,
  configItems: Partial<ConfigCache> = {},
) {
  const browserContext = 'context' in context ? context.context() : context;
  await browserContext.addCookies([
    {
      name: TEST_CONFIG_COOKIE,
      value: encodeURIComponent(
        JSON.stringify({
          features: configItems.features ?? [],
          settings: configItems.settings ?? [],
          branding: configItems.branding ?? [],
        }),
      ),
      domain: 'localhost',
      path: '/',
    },
  ]);
}

async function screenshotOnFailure({ page }: { page: Page }, testInfo: TestInfo) {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Get a unique place for the screenshot.
    const screenshotPath = testInfo.outputPath(`failure.png`);
    // Add it to the report.
    testInfo.attachments.push({
      name: 'screenshot-at-failure',
      path: screenshotPath,
      contentType: 'image/png',
    });
    // Take the screenshot itself.
    await page.screenshot({ path: screenshotPath, timeout: 5000 });
  }
}

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

function missingLocalStorage(
  expected: Pick<StorageState, 'origins'>,
  actual: StorageState,
): string[] {
  return expected.origins.flatMap(({ origin, localStorage }) => {
    const present = new Set(
      actual.origins.find((o) => o.origin === origin)?.localStorage.map((item) => item.name),
    );
    return localStorage
      .filter((item) => !present.has(item.name))
      .map((item) => `${origin} ${item.name}`);
  });
}

const MAX_STORAGE_STATE_REAPPLIES = 3;

/**
 * Under heavy load WebKit sometimes starts a context without the localStorage Playwright restored
 * from `storageState`, so a signed-in test begins with no token and the app sends it to /login.
 */
export async function ensureStorageState(
  context: BrowserContext,
  storageState: PlaywrightTestOptions['storageState'],
  testInfo: TestInfo,
): Promise<StorageState> {
  let actual = await context.storageState();
  if (!storageState) return actual;
  const expected =
    typeof storageState === 'string'
      ? (JSON.parse(readFileSync(storageState, 'utf8')) as StorageState)
      : storageState;
  for (let reapplied = 0; ; reapplied++) {
    const missing = missingLocalStorage(expected, actual);
    if (missing.length === 0) return actual;
    if (reapplied === MAX_STORAGE_STATE_REAPPLIES) {
      throw new Error(
        `storageState localStorage missing after ${reapplied} re-applies: ${missing.join(', ')}`,
      );
    }
    testInfo.annotations.push({ type: 'storage-state-reapplied', description: missing.join(', ') });
    console.warn(
      `storage-state-reapplied: ${testInfo.titlePath.join(' > ')}: ${missing.join(', ')}`,
    );
    await context.setStorageState(expected);
    actual = await context.storageState();
  }
}

export const test = base.extend({
  context: async ({ context, storageState }, use, testInfo) => {
    // Playwright's storageState only persists localStorage, not sessionStorage.
    // The app stores user data in sessionStorage (tab-scoped). Extract user from
    // the fixture's localStorage and inject it into sessionStorage before any page
    // scripts run, so the user store initializes with the correct data.
    const state = await ensureStorageState(context, storageState, testInfo);
    const origin = state.origins?.find((o) => o.localStorage);
    const userData = origin?.localStorage?.find((item) => item.name === 'user')?.value;

    await context.addInitScript(
      ({ user }) => {
        try {
          sessionStorage.setItem('type', 'AUTH0');
          sessionStorage.setItem('redirect', '/');
          if (user) sessionStorage.setItem('user', user);
        } catch {
          // Cross-origin frames (auth providers, analytics) block sessionStorage access
        }
      },
      { user: userData },
    );

    // Stub log endpoint so tests don't wait on fire-and-forget audit requests
    await context.route('**/api/v1/log', (route) =>
      route.fulfill({ status: 202, json: { result: 'accepted' } }),
    );
    // Backend calls that no test route answered. Every route a test registers is registered
    // after this one, so it runs first; anything that reaches here would otherwise hit the
    // preview server (which has no backend) and fail in a way the test never asked for.
    const unmockedApiCalls: string[] = [];
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'localhost') {
        // ignore all non local api endpoints to improve speed.
        return route.abort();
      }
      if (/\/(picsure|psama)\//.test(url.pathname)) {
        const resultType = url.pathname.endsWith('/query/sync')
          ? ` (${route.request().postDataJSON()?.query?.expectedResultType})`
          : '';
        unmockedApiCalls.push(
          `${route.request().method()} ${url.pathname}${url.search}${resultType}`,
        );
        return route.fulfill({ status: 501, body: 'Not mocked by this test' });
      }
      // fallback(), not continue(): continue() sends the request straight to the network,
      // skipping context routes registered before this one (e.g. the log stub above).
      return route.fallback();
    });

    // Stub TOS endpoint so the terms modal doesn't block authenticated tests
    await context.route('*/**/psama/tos/latest', (route) =>
      route.fulfill({ status: 200, body: '<p>Test Terms of Service</p>' }),
    );
    // Anonymous pages ask PSAMA for an open-access session before their first data request. A 404
    // means sessions are off here, so requests go out keyless; session tests answer it themselves.
    await context.route('**/psama/open/session', (route) => route.fulfill({ status: 404 }));

    // An empty backend for reads pages make incidentally: the banner feed on every page, the
    // API page's documentation registry, and the admin Configuration tabs' lists. GET only, so
    // an unmocked write still fails the test. Tests that care register their own routes,
    // which run before these.
    const emptyReads: [string, unknown][] = [
      ['**/picsure/operations/banners/active', []],
      ['**/picsure/operations/banners', []],
      ['**/picsure/openapi', []],
      ['**/psama/role', []],
      ['**/psama/privilege', []],
      ['**/psama/connection', []],
      ['**/psama/application', []],
    ];
    for (const [path, json] of emptyReads) {
      await mockApiSuccessByMethod(context, path, 'GET', json);
    }
    // The landing page loads its stats from the same endpoints the explorer uses, so answer
    // them empty only while the page is the landing page; elsewhere they must be mocked.
    const emptyLandingStats: [string, unknown][] = [
      [
        '**/picsure/dictionary/concepts?page_number=1&page_size=1',
        { content: [], totalElements: 0 },
      ],
      ['**/picsure/dictionary/facets', []],
      ['**/picsure/hpds/*/query/sync', 0],
    ];
    for (const [path, json] of emptyLandingStats) {
      await context.route(path, (route) =>
        pagePathname(route) === '/' ? route.fulfill({ json }) : route.fallback(),
      );
    }

    // The admin Configuration page mounts all of its tabs' content up front (see
    // ConfigKindTab.svelte), so every test that visits /admin/configuration - not just
    // the ones exercising config fields - triggers these GET requests. Default to "no
    // admin overrides" so unrelated tests don't wait on/hit an unmocked endpoint. Tests
    // that care about specific rows override per-kind via a page-level mockApiSuccess,
    // which takes precedence over this context-level default.
    await context.route(`${configurationPath}?kind=*`, (route) => route.fulfill({ json: [] }));

    await use(context);

    expect(
      [...new Set(unmockedApiCalls)],
      'API calls this test did not mock (mock them, or mockApiFail them on purpose)',
    ).toEqual([]);
  },
  page: async ({ page }, use, testInfo) => {
    await mockApiSuccess(page, 'https://www.googletagmanager.com/**/*', {});
    // Clicks that land before hydration are silently dropped, so page loads wait for the root
    // layout's hydration marker (see src/routes/+layout.svelte) before returning.
    const waitForHydration = async () => {
      if (new URL(page.url()).hostname === 'localhost') {
        await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
      }
    };
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      await waitForHydration();
      return response;
    };
    const reload = page.reload.bind(page);
    page.reload = async (options) => {
      const response = await reload(options);
      await waitForHydration();
      return response;
    };
    await use(page);
    // Take screenshot on failure
    await screenshotOnFailure({ page }, testInfo);
  },
});

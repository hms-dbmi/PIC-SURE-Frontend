import { test as base, type Route, type BrowserContext, type Page } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import type { ConfigCache } from '../../src/lib/models/Configuration';
import { TEST_CONFIG_COOKIE } from '../../src/lib/testConfig';
import * as mockData from './mock-data';
import { configurationPath } from './mock-data';

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

export const test = base.extend({
  context: async ({ context }, use) => {
    // Playwright's storageState only persists localStorage, not sessionStorage.
    // The app stores user data in sessionStorage (tab-scoped). Extract user from
    // the fixture's localStorage and inject it into sessionStorage before any page
    // scripts run, so the user store initializes with the correct data.
    const storageState = await context.storageState();
    const origin = storageState.origins?.find((o) => o.localStorage);
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
    await context.route('**/*', (request) => {
      const url = request.request().url();
      if (
        // url.startsWith('https://www.googletagmanager.com') // Google Analytics
        !url.startsWith('http://localhost') // ignore all non local api endpoints to improve speed.
      ) {
        request.abort();
      } else {
        // fallback(), not continue(): continue() sends the request straight to the network,
        // skipping context routes registered before this one (e.g. the log stub above).
        request.fallback();
      }
    });

    // Stub TOS endpoint so the terms modal doesn't block authenticated tests
    await context.route('*/**/psama/tos/latest', (route) =>
      route.fulfill({ status: 200, body: '<p>Test Terms of Service</p>' }),
    );

    // The admin Configuration page mounts all of its tabs' content up front (see
    // ConfigKindTab.svelte), so every test that visits /admin/configuration - not just
    // the ones exercising config fields - triggers these GET requests. Default to "no
    // admin overrides" so unrelated tests don't wait on/hit an unmocked endpoint. Tests
    // that care about specific rows override per-kind via a page-level mockApiSuccess,
    // which takes precedence over this context-level default.
    await context.route(`${configurationPath}?kind=*`, (route) => route.fulfill({ json: [] }));
    // Site banners is the first tab plain admins see there, so it loads on their every visit.
    await context.route('**/picsure/operations/banners', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.fallback(),
    );

    await use(context);
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

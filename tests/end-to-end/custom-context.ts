import { test as base, type Route, type BrowserContext, type Page } from '@playwright/test';
import type { TestInfo } from '@playwright/test';

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

export const defaultTestFlags = [
  // { name: 'RESOURCE_HPDS', value: '1' },
  // { name: 'RESOURCE_OPEN_HPDS', value: '2' },
  // { name: 'RESOURCE_OPEN_V3_HPDS', value: '2' },
  // { name: 'RESOURCE_BASE_QUERY', value: '3' },
  // { name: 'RESOURCE_VIZ', value: '4' },
  // { name: 'RESOURCE_APPLICATION', value: '5' },
  // { name: 'MAX_CONFIG_RETRIES', value: '0' },
  { name: 'OPEN', value: 'true' },
  { name: 'ALLOW_EXPORT', value: 'true' },
  { name: 'ALLOW_DOWNLOAD', value: 'true' },
  { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
  { name: 'ENABLE_HIERARCHY', value: 'true' },
  { name: 'DATA_REQUESTS', value: 'true' },
  { name: 'DIST_EXPLORER', value: 'true' },
  { name: 'ENABLE_SNP_QUERY', value: 'true' },
  { name: 'ENABLE_GENE_QUERY', value: 'true' },
  { name: 'VARIANT_EXPLORER', value: 'true' },
  { name: 'EXPLORE_TOUR', value: 'true' },
  { name: 'REQUIRE_CONSENTS', value: 'true' },
  { name: 'USE_QUERY_TEMPLATE', value: 'true' },
  { name: 'ANALYZE_API', value: 'true' },
  { name: 'ANALYZE_ANALYSIS', value: 'false' },
  { name: 'DISCOVER', value: 'true' },
  { name: 'COLLABORATE', value: 'true' },
  { name: 'DASHBOARD', value: 'true' },
  { name: 'DASHBOARD_DRAWER', value: 'true' },
  { name: 'ENABLE_SAMPLE_ID_CHECKBOX', value: 'true' },
  { name: 'ENABLE_COHORT_DETAILS', value: 'true' },
  { name: 'FEDERATED', value: 'false' },
  { name: 'SHOW_TREE_STEP', value: 'true' },
  { name: 'ENABLE_REDCAP_EXPORT', value: 'false' },
  { name: 'ENABLE_TOS', value: 'true' },
  { name: 'ENFORCE_TOS_ACCEPT', value: 'true' },
  { name: 'OR_QUERIES', value: 'true' },
  { name: 'RESTORE_V2_QUERY', value: 'true' },
];

const defaultTestSettings = [
  // { name: 'WEBSERVER_LOG_STDERR', value: 'ignore' },
  // { name: 'WEBSERVER_LOG_STDOUT', value: 'ignore' },
  // { name: 'PROJECT_HOST_NAME', value: 'pic-sure.org' },
  { name: 'EXPLORE_TOUR_SEARCH_TERM', value: 'age' },
  { name: 'VARIANT_EXPLORER_TYPE', value: 'aggregate' },
  { name: 'VARIANT_EXPLORER_MAX_COUNT', value: '20' },
  { name: 'VARIANT_EXPLORER_EXCLUDE_COLUMNS', value: "'[]'" },
  { name: 'VARIANT_EXPLORER_EXCLUDE_COLUMNS', value: "'[]'" },
  { name: 'AUTH_TOUR_NAME', value: 'NHANES-Auth' },
  { name: 'OPEN_TOUR_NAME', value: 'BDC-Open' },
  { name: 'EXPORT_SYSTEM_FIELDS', value: '_consents' },
  { name: 'LOGGING_API_KEY', value: 'test-key' },
];

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
        request.continue();
      }
    });

    // Stub TOS endpoint so the terms modal doesn't block authenticated tests
    await context.route('*/**/psama/tos/latest', (route) =>
      route.fulfill({ status: 200, body: '<p>Test Terms of Service</p>' }),
    );

    use(context);
  },
  page: async ({ page }, use, testInfo) => {
    // await mockApiSuccess(page, '*/**/api/config', { features: defaultTestFlags, settings: defaultTestSettings });
    await mockApiSuccess(page, 'https://www.googletagmanager.com/**/*', {});
    await use(page);
    // Take screenshot on failure
    await screenshotOnFailure({ page }, testInfo);
  },
});

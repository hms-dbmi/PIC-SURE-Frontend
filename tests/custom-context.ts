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

    // Stub TOS endpoint so the terms modal doesn't block authenticated tests
    await context.route('*/**/psama/tos/latest', (route) =>
      route.fulfill({ status: 200, body: '<p>Test Terms of Service</p>' }),
    );

    use(context);
  },
  page: async ({ page }, use, testInfo) => {
    await use(page);
    // Take screenshot on failure
    await screenshotOnFailure({ page }, testInfo);
  },
});

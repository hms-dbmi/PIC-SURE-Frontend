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
    await context.addInitScript(() => {
      sessionStorage.setItem('type', 'AUTH0');
      sessionStorage.setItem('redirect', '/');
    });

    use(context);
  },
  page: async ({ page }, use, testInfo) => {
    await use(page);
    // Take screenshot on failure
    await screenshotOnFailure({ page }, testInfo);
  },
});

import { test as base, type Route, type BrowserContext, type Page } from '@playwright/test';
import { picsureUser } from './mock-data';
import type { User } from '../src/lib/models/User';
import type { TestInfo } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockApiSuccess(context: BrowserContext | Page, path: string, json: any) {
  return context.route(path, async (route: Route) => route.fulfill({ json }));
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
export const unauthedTest = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      window.sessionStorage.clear();
      sessionStorage.setItem('type', 'AUTH0');
      sessionStorage.setItem('redirect', '/');
      localStorage.clear();
    });

    use(context);
  },
});

export const test = base.extend({
  context: async ({ context }, use) => {
    await mockApiSuccess(context, '*/**/psama/user/me?hasToken', picsureUser);
    await mockApiSuccess(context, '*/**/psama/user/me', picsureUser);
    await context.addInitScript((picsureUser: User) => {
      sessionStorage.setItem('type', 'AUTH0');
      sessionStorage.setItem('redirect', '/');
      localStorage.setItem('user', JSON.stringify(picsureUser));
      localStorage.setItem(
        'token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6OTYwOTU3Mjk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.M1W7a3jQNoHQxAUwfj3sDqyVtNH_DkRdzsIF3prIYQA',
      );
    });

    use(context);
  },
});

test.beforeEach(async ({ page }) => {
  // We must accept the Google consent dialog before we can interact with some elements in the page.
  await page.goto('/');
  await page.waitForSelector('[data-testid="consentModal"]');
  const acceptConsentButton = page.getByTestId('acceptGoogleConsent');
  await acceptConsentButton.click();
});

test.afterEach(screenshotOnFailure);

export function getUserTest(user: User = picsureUser) {
  return base.extend({
    context: async ({ context }, use) => {
      await context.addInitScript((user: User) => {
        sessionStorage.setItem('type', 'AUTH0');
        sessionStorage.setItem('redirect', '/');
        localStorage.setItem(
          'token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHBpYy1zdXJlLm9yZyIsImV4cCI6OTYwOTU3Mjk4MiwiaWF0IjoxNjA5NTcyOTgyfQ.M1W7a3jQNoHQxAUwfj3sDqyVtNH_DkRdzsIF3prIYQA',
        );
        localStorage.setItem('user', JSON.stringify(user));
      });

      await mockApiSuccess(context, '*/**/psama/authentication', user);
      await mockApiSuccess(context, '*/**/psama/authentication/auth0', user);
      await mockApiSuccess(context, '*/**/psama/authentication/fence', user);
      await mockApiSuccess(context, '*/**/psama/user/me?hasToken', user);
      await mockApiSuccess(context, '*/**/psama/user/me', user);

      use(context);
    },
  });
}

export async function screenshotOnFailure({ page }: { page: Page }, testInfo: TestInfo) {
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

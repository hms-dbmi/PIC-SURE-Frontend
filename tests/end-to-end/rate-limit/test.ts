import { expect, type Page, type Route } from '@playwright/test';

import { test, mockApiConfig } from '../custom-context';
import { facetResultPath, searchResultPath } from '../mock-data';
import { userIsLoggedIn } from '../utils';

// a real 429 from the gateway, so the message has to survive api.ts, the stores and the components
const WAIT_MESSAGE = "You've made too many requests. Try again in 30 seconds.";
const REQUEST_ID = 'rate-limit-e2e-request';
const openCountResultPath = '*/**/picsure/hpds/open/query/sync';
const dashboardPath = '*/**/picsure/dictionary/dashboard';

function tooManyRequests(route: Route) {
  return route.fulfill({
    status: 429,
    headers: { 'Retry-After': '30' },
    json: {
      errorType: 'rate_limited',
      message: 'Rate limit exceeded.',
      requestId: REQUEST_ID,
    },
  });
}

// Page-level route takes precedence over the context-level 202 stub in custom-context.ts
async function captureLogs(page: Page) {
  const events: { action?: string; metadata?: Record<string, unknown> }[] = [];
  await page.route('**/api/v1/log', (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ status: 202, json: { result: 'accepted' } });
  });
  return events;
}

const openFeatures = [
  { name: 'OPEN', value: 'true' },
  { name: 'DISCOVER', value: 'true' },
  // routes anonymous counts through openCountResultPath
  { name: 'OPEN_EXPLORER', value: 'false' },
  { name: 'DASHBOARD', value: 'true' },
];

test.describe('Rate-limited anonymous visitor', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: openFeatures });
  });

  test('sees the wait on search, facets and counts, and the 429 is logged', async ({ page }) => {
    const logs = await captureLogs(page);
    let served = 0;
    const countedTooManyRequests = (route: Route) => {
      served++;
      return tooManyRequests(route);
    };
    await page.route(searchResultPath, countedTooManyRequests);
    await page.route(facetResultPath, countedTooManyRequests);
    await page.route(openCountResultPath, countedTooManyRequests);

    await page.goto('/discover?search=somedata');

    await expect(
      page
        .getByTestId('error-alert')
        .filter({ hasText: 'Sorry, we could not retrieve your search results.' }),
    ).toContainText(WAIT_MESSAGE);
    await expect(page.locator('#facet-side-bar')).toContainText(WAIT_MESSAGE);

    // the button can be clicked before hydration, which drops the click
    await expect(async () => {
      await page.locator('#results-panel-toggle').click();
      await expect(page.locator('#results-panel')).toBeVisible({ timeout: 1000 });
    }).toPass();
    const resultsPanel = page.locator('#results-panel');
    await expect(resultsPanel.locator('#result-count')).toHaveText('N/A');
    await expect(resultsPanel.getByTestId('error-alert')).toContainText(WAIT_MESSAGE);

    await expect(page).toHaveURL(/\/discover\?search=somedata$/);
    // every 429 served is reported; only once they all have can a stray error.unknown be ruled out
    const rateLimited = () => logs.filter((event) => event.action === 'request.rate_limited');
    await expect
      .poll(() => served - rateLimited().length, {
        message: 'every 429 served is logged as request.rate_limited',
      })
      .toBe(0);
    for (const event of rateLimited()) {
      expect(event.metadata).toEqual({ retryAfter: 30, requestId: REQUEST_ID });
    }
    expect(logs.some((event) => event.action === 'error.unknown')).toBe(false);
  });

  test('sees the wait on the dashboard', async ({ page }) => {
    await page.route(dashboardPath, tooManyRequests);

    await page.goto('/dashboard');

    await expect(page.locator('#data-container')).toContainText(WAIT_MESSAGE);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('Rate-limited logged-in user', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test('sees the wait and stays logged in', async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'DASHBOARD', value: 'true' }] });
    await page.route(dashboardPath, tooManyRequests);

    await page.goto('/dashboard');

    await expect(page.locator('#data-container')).toContainText(WAIT_MESSAGE);
    await expect(page).toHaveURL(/\/dashboard$/);
    await userIsLoggedIn(page);
  });
});

import { expect, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults as mockData,
} from '../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

function discoverFeatures(wafRecovery: boolean) {
  return {
    features: [
      { name: 'OPEN', value: 'true' },
      { name: 'DISCOVER', value: 'true' },
      { name: 'OPEN_EXPLORER', value: 'false' },
      ...(wafRecovery ? [{ name: 'WAF_CAPTCHA_RECOVERY', value: 'true' }] : []),
    ],
  };
}

// Page-level route takes precedence over the context-level 202 stub in
// custom-context.ts, letting us capture the audit events tests assert on.
async function captureLogActions(page: Page): Promise<string[]> {
  const actions: string[] = [];
  await page.route('**/api/v1/log', (route) => {
    const action = route.request().postDataJSON()?.action;
    if (action) actions.push(action);
    return route.fulfill({ status: 202, json: { result: 'accepted' } });
  });
  return actions;
}

// Simulates AWS WAF's CAPTCHA action intercepting the first search request only.
// Locally there is no real interstitial, so the app's recovery reload re-issues
// the search, which then hits the success mock - recovery is observable as the
// page working with zero user interaction.
function mockWafCaptchaOnce(page: Page) {
  return page.route(
    searchResultPath,
    (route) =>
      route.fulfill({
        status: 405,
        headers: { 'x-amzn-waf-action': 'captcha' },
        contentType: 'text/html',
        body: '<html>waf interstitial</html>',
      }),
    { times: 1 },
  );
}

test.describe('AWS WAF CAPTCHA recovery', () => {
  let searchRequests: number;

  test.beforeEach(async ({ page }) => {
    searchRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('dictionary-api/concepts?')) searchRequests++;
    });
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
  });

  test('reloads through the WAF CAPTCHA and recovers without user interaction', async ({
    page,
  }) => {
    await mockApiConfig(page, discoverFeatures(true));
    const logActions = await captureLogActions(page);
    await mockWafCaptchaOnce(page);

    await page.goto('/discover?search=somedata');

    await expect.poll(() => logActions).toContain('waf.captcha_shown');
    await expect.poll(() => logActions).toContain('waf.captcha_resolved');
    await expect.poll(() => searchRequests).toBe(2); // 405'd once, retried by the reload
    expect(logActions.filter((action) => action === 'waf.captcha_shown')).toHaveLength(1);

    // App is functional after the reload
    await expect(page.locator('#search-bar')).toBeVisible();

    expect(await page.evaluate(() => sessionStorage.getItem('waf-captcha-pending'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('waf-captcha-guard'))).not.toBeNull();
  });

  test('feature off: no reload, no WAF audit events, existing error path', async ({ page }) => {
    await mockApiConfig(page, discoverFeatures(false));
    const logActions = await captureLogActions(page);
    await mockWafCaptchaOnce(page);

    await page.goto('/discover?search=somedata');

    // The 405 takes today's generic error path, whose audit event marks completion
    await expect.poll(() => logActions).toContain('error.unknown');

    expect(logActions.filter((action) => action.startsWith('waf.'))).toHaveLength(0);
    expect(searchRequests).toBe(1); // no reload, so no retry
  });
});

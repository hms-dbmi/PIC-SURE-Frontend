import { expect, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail, mockApiConfig } from '../custom-context';

import { mockDashboard, searchResults, searchResultPath, facetResultPath } from '../mock-data';
import { userIsLoggedIn } from '../utils';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

const consentsPath = '*/**/psama/user/me/consents';

/** The state a reload lands in after a failed access fetch: privileges intact, no consents. */
async function reloadStateWithoutAccess(page: Page) {
  await page.addInitScript(() => {
    const raw = sessionStorage.getItem('user');
    if (!raw) return;
    const stored = JSON.parse(raw);
    delete stored.consents;
    sessionStorage.setItem('user', JSON.stringify(stored));
  });
}

test.describe('Access unavailable', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'DASHBOARD', value: 'true' },
        { name: 'DASHBOARD_DRAWER', value: 'true' },
      ],
    });
    await mockApiSuccess(page, '*/**/picsure/dictionary/dashboard', mockDashboard);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, facetResultPath, []);
  });

  test('failing consents on login warns the user instead of failing silently', async ({ page }) => {
    await reloadStateWithoutAccess(page);
    await mockApiFail(page, consentsPath, 'connectionfailed');

    await page.goto('/dashboard');
    await userIsLoggedIn(page);

    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('data-type', 'error');
    await expect(toast).toContainText('could not load which studies you have access to');
  });

  test('dictionary search stays closed rather than returning every concept', async ({ page }) => {
    await reloadStateWithoutAccess(page);
    await mockApiFail(page, consentsPath, 'connectionfailed');

    let conceptRequests = 0;
    await page.route('**/picsure/dictionary/concepts**', (route) => {
      conceptRequests++;
      return route.abort();
    });

    await page.goto('/explorer?search=age');
    await userIsLoggedIn(page);

    await expect(page.getByTestId('toast-root')).toContainText(
      'could not load which studies you have access to',
    );
    // An empty consents list would make the dictionary return everything, so expect none.
    expect(conceptRequests).toBe(0);
  });

  test('access loads normally when the endpoint works', async ({ page }) => {
    await page.goto('/dashboard');
    await userIsLoggedIn(page);

    await expect(page.locator('#data-container')).toBeVisible();
    await expect(page.getByTestId('toast-root')).not.toBeVisible();
  });
});

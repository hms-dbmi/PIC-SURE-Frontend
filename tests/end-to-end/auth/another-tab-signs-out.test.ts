import { expect, type BrowserContext, type Page } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import {
  countResultPath,
  deniedFilterTree,
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults,
} from '../../support/mock-data';
import { userIsLoggedIn, userIsLoggedOut } from '../utils';

const filter = (page: Page) =>
  page.getByTestId(`results-filter-item-${deniedFilterTree.children[0].id}`);

/** Opens another tab of the same browser on `path`, once it has hydrated. */
async function openTab(context: BrowserContext, path: string): Promise<Page> {
  const tab = await context.newPage();
  await tab.goto(path);
  await tab.locator('html[data-hydrated]').waitFor({ state: 'attached' });
  await userIsLoggedIn(tab);
  return tab;
}

async function logOutFromMenu(page: Page) {
  // Retried because a click before hydration is dropped
  await expect(async () => {
    await page.getByTestId('app-nav-user-menu-trigger').click();
    await expect(page.locator('#app-nav-logout')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await page.locator('#app-nav-logout').click();
}

/** Signs `page` in again with the token the tabs shared, and opens the explorer. */
async function logBackIn(page: Page, token: string | null) {
  await page.evaluate((token) => localStorage.setItem('token', token ?? ''), token);
  await page.goto('/explorer');
  await userIsLoggedIn(page);
}

test.describe('A tab whose user signs out in another tab', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, searchResultPath, searchResults);
    await mockApiSuccess(context, facetResultPath, facetsResponse);
    await mockApiSuccess(context, countResultPath, 565);
    await mockApiSuccess(context, '*/**/psama/logout', {});
  });

  test.describe('on a deployment that requires a login', () => {
    test.beforeEach(async ({ page, context }) => {
      await mockApiConfig(context, { features: [{ name: 'OPEN', value: 'false' }] });
      await page.addInitScript((tree) => {
        if (sessionStorage.getItem('test-seeded')) return;
        sessionStorage.setItem('test-seeded', 'true');
        sessionStorage.setItem('filterTree', JSON.stringify(tree));
      }, deniedFilterTree);
      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await expect(filter(page)).toBeVisible();
    });

    test('goes to log in, and drops its filters when the user chose to log out', async ({
      page,
      context,
    }) => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const other = await openTab(context, '/help');

      await logOutFromMenu(other);

      await expect(other).toHaveURL(/\/login$/);
      await expect(page).toHaveURL('/login?redirectTo=%2Fexplorer');
      await logBackIn(page, token);
      await expect(filter(page)).toHaveCount(0);
    });

    test('goes to log in, and keeps its filters when the session timed out', async ({
      page,
      context,
    }) => {
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const other = await context.newPage();
      await other.route('*/**/picsure/operations/dataset/named', (route) =>
        route.fulfill({ status: 401, body: '' }),
      );

      await other.goto('/dataset');

      await expect(other).toHaveURL('/login?redirectTo=%2Fdataset');
      await expect(page).toHaveURL('/login?redirectTo=%2Fexplorer');
      await logBackIn(page, token);
      await expect(filter(page)).toBeVisible();
    });
  });

  test('stays on a public page of an open deployment, signed out', async ({ page, context }) => {
    await mockApiConfig(context, { features: [{ name: 'OPEN', value: 'true' }] });
    await page.goto('/');
    await userIsLoggedIn(page);
    const other = await openTab(context, '/help');
    // Running the guards again reloads the page's data, the server's included.
    const guardsRanAgain = page.waitForResponse((response) =>
      response.url().includes('__data.json'),
    );

    await logOutFromMenu(other);

    await expect(other).toHaveURL(/\/login$/);
    await userIsLoggedOut(page);
    await guardsRanAgain;
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await expect(page).toHaveURL('/');
  });
});

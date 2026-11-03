import { expect, type Page } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import {
  countResultPath,
  deniedFilterTree,
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults,
} from '../mock-data';

const filterId = deniedFilterTree.children[0].id;

function storedFilterIds(page: Page) {
  return page.evaluate(() => {
    const tree = sessionStorage.getItem('filterTree');
    return tree === null
      ? null
      : JSON.parse(tree).children.map((child: { id: string }) => child.id);
  });
}

// Clicks that land before Svelte hydration are dropped, so retry until the menu opens
async function clickLogout(page: Page) {
  await expect(async () => {
    await page.locator('#user-session-avatar button').first().click();
    await expect(page.locator('#user-logout-btn')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await page.locator('#user-logout-btn').click();
}

test.describe('Logging out from the menu', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, countResultPath, 565);
    await mockApiSuccess(page, '*/**/psama/logout', {});
    await page.addInitScript((tree) => {
      if (sessionStorage.getItem('test-seeded')) return;
      sessionStorage.setItem('test-seeded', 'true');
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    }, deniedFilterTree);
  });

  test('clears the filters so the next login starts without them', async ({ page }) => {
    await page.goto('/explorer');
    await expect(page.getByTestId(`added-filter-${filterId}`)).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('token'));

    await clickLogout(page);

    await expect(page).toHaveURL(/\/login$/);
    // an empty tree rather than null means the in-memory stores were reset and stored
    await expect.poll(() => storedFilterIds(page)).toEqual([]);

    // log back in: the discarded filters must not come back
    await page.evaluate((token) => localStorage.setItem('token', token ?? ''), token);
    await page.goto('/explorer');

    await expect(page.getByTestId('user-info-btn')).toBeVisible();
    await expect(page.getByTestId(`added-filter-${filterId}`)).toHaveCount(0);
    expect(await storedFilterIds(page)).toEqual([]);
  });
});

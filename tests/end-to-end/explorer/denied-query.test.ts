import { expect, type Page } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import { facetResultPath, facetsResponse, searchResultPath, searchResults } from '../mock-data';

const countResultPath = '*/**/picsure/hpds/auth/query/sync';

function storedFilterIds(page: Page) {
  return page.evaluate(() => {
    const tree = JSON.parse(sessionStorage.getItem('filterTree') || '{"children":[]}');
    return (tree.children as { id: string }[]).map((child) => child.id);
  });
}

test.describe('Logout from a rejected query', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, '*/**/psama/logout', {});
    // seeds only the first load: the logout can reload the page, and reseeding would hide what it left in storage
    await page.addInitScript(() => {
      if (sessionStorage.getItem('test-seeded')) return;
      sessionStorage.setItem('test-seeded', 'true');
      sessionStorage.setItem(
        'filterTree',
        JSON.stringify({
          uuid: 'root',
          operator: 'AND',
          children: [
            {
              uuid: 'saved-filter',
              id: '\\saved-study\\variable\\',
              filterType: 'Categorical',
              displayType: 'restrict',
              variableName: 'Saved variable',
              allowFiltering: true,
              dataset: 'saved-study',
              categoryValues: ['Yes'],
            },
          ],
        }),
      );
    });
  });

  test('clears saved filters when the query is forbidden', async ({ page }) => {
    let countRequests = 0;
    await page.route(countResultPath, (route) => {
      countRequests++;
      return route.fulfill({
        status: 403,
        json: { errorType: 'forbidden', message: 'User is not authorized.' },
      });
    });

    await page.goto('/explorer');

    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => storedFilterIds(page)).toEqual([]);
    // clearing the filters must not make the still-mounted explorer rerun its count query
    await page.waitForLoadState('networkidle');
    expect(countRequests).toBe(1);
  });

  test('clears saved filters when the logout falls back to a full page load', async ({ page }) => {
    await page.route(countResultPath, (route) =>
      route.fulfill({
        status: 403,
        json: { errorType: 'forbidden', message: 'User is not authorized.' },
      }),
    );
    // a failed client-side load makes SvelteKit navigate natively, so the logout never settles
    await page.route('**/login/__data.json*', (route) => route.abort());

    await page.goto('/explorer');

    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => storedFilterIds(page)).toEqual([]);
  });

  test('keeps saved filters when the session expires', async ({ page }) => {
    await page.route(countResultPath, (route) =>
      route.fulfill({
        status: 401,
        json: { errorType: 'unauthorized', message: 'Token invalid or expired.' },
      }),
    );

    await page.goto('/explorer');

    await expect(page).toHaveURL(/\/login\?/);
    expect(await storedFilterIds(page)).toEqual(['\\saved-study\\variable\\']);
  });
});

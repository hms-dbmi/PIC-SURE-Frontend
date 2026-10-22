import { expect, type Page, type Route } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import {
  countResultPath,
  deniedFilterTree,
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults,
} from '../../support/mock-data';

// null when nothing is stored, which is all a forbidden logout leaves until the stores are reset
function storedFilterIds(page: Page) {
  return page.evaluate(() => {
    const tree = sessionStorage.getItem('filterTree');
    return tree === null
      ? null
      : JSON.parse(tree).children.map((child: { id: string }) => child.id);
  });
}

function forbid(route: Route) {
  return route.fulfill({
    status: 403,
    json: { errorType: 'forbidden', message: 'User is not authorized.' },
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
    await page.addInitScript((tree) => {
      if (sessionStorage.getItem('test-seeded')) return;
      sessionStorage.setItem('test-seeded', 'true');
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    }, deniedFilterTree);
  });

  test('clears saved filters when the query is forbidden', async ({ page }) => {
    let countRequests = 0;
    await page.route(countResultPath, (route) => {
      countRequests++;
      return forbid(route);
    });

    await page.goto('/explorer');

    await expect(page).toHaveURL(/\/login$/);
    // an empty tree rather than null means the in-memory stores were reset and stored
    await expect.poll(() => storedFilterIds(page)).toEqual([]);
    await page.waitForLoadState('networkidle');
    expect(countRequests).toBe(1);
  });

  test('clears saved filters when the logout falls back to a full page load', async ({ page }) => {
    await page.route(countResultPath, forbid);
    // a failed client-side load makes SvelteKit fall back to loading the login page natively
    await page.route('**/login/__data.json*', (route) => route.abort());
    const loginPageLoad = page.waitForRequest(
      (request) =>
        request.resourceType() === 'document' && new URL(request.url()).pathname === '/login',
    );

    await page.goto('/explorer');

    await loginPageLoad;
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(async () => (await storedFilterIds(page)) ?? []).toEqual([]);
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
    expect(await storedFilterIds(page)).toEqual(['\\denied-study\\variable\\']);
  });
});

import { expect, type Route } from '@playwright/test';
import { test } from '../../custom-context';
import { searchResults as mockData, searchResultPath } from '../../mock-data';

test.describe('explorer', () => {
  test('Has datatable, filters, and searchbar', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    page.url;
    await page.goto('/explorer');

    // Then
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#search-filters')).toBeVisible();
  });
  test.describe('#search-filters', () => {
    test('Tag toggles included icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator('#tag-dataset-nhanes-include');
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Included state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'true');
    });
    test('Tag toggles included icon off', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator('#tag-dataset-nhanes-include');
      await tag.click(); // to Included state
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Default state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles excluded icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator('#tag-dataset-nhanes-exclude');
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Excluded state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'true');
    });
    test('Tag toggles excluded icon off', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator('#tag-dataset-nhanes-exclude');
      await tag.click(); // to Excluded state
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Default state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles excluded icon off and included icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const excludeTag = page.locator('#tag-dataset-nhanes-exclude');
      await excludeTag.click(); // to Excluded state
      await expect(excludeTag).toHaveAttribute('aria-checked', 'true');

      //When
      const includeTag = page.locator('#tag-dataset-nhanes-include');
      await includeTag.click(); // to Included state

      // Then
      await expect(includeTag).toHaveAttribute('aria-checked', 'true');
      await expect(excludeTag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles included icon off and excluded icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const includeTag = page.locator('#tag-dataset-nhanes-include');
      await includeTag.click(); // to Included state
      await expect(includeTag).toHaveAttribute('aria-checked', 'true');

      //When
      const excludeTag = page.locator('#tag-dataset-nhanes-exclude');
      await excludeTag.click(); // to Excluded state

      // Then
      await expect(excludeTag).toHaveAttribute('aria-checked', 'true');
      await expect(includeTag).toHaveAttribute('aria-checked', 'false');
    });
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await page.route(searchResultPath, (route: Route) => route.abort('accessdenied'));
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
});

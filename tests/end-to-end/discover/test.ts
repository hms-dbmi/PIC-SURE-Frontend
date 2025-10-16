import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults as mockData,
  conceptsDetailPath,
  detailResponseCat,
  crossCountSyncResponseInital,
  crossCountSyncResponsePlus3,
  crossCountSyncResponseLessThan10,
} from '../mock-data';
import { getOption, nthFilterIcon, clickNthFilterIcon } from '../utils';

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, searchResultPath, mockData);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
});

test('Has filters, and searchbar', async ({ page }) => {
  // Given
  await page.goto('/discover');

  // Then
  await expect(page.locator('#search-bar')).toBeVisible();
  await expect(page.locator('#facet-side-bar')).toBeVisible();
});
test('Discover can display ±3', async ({ page }) => {
  // Given
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
  await mockApiSuccess(page, '*/**/picsure/query/sync', crossCountSyncResponsePlus3);
  await page.goto('/discover?search=somedata');

  // When
  await clickNthFilterIcon(page);
  const firstItem = await getOption(page);
  await firstItem.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();
  const raw = crossCountSyncResponsePlus3['\\_studies_consents\\'];
  const match = raw.match(/^(\d[\d,]*)\s*±(\d+)$/);
  const numeric = parseInt((match?.[1] || '0').replace(/,/g, '')) || 0;
  const plusMinus = match?.[2] || '0';

  // Then
  await expect(page.locator('#results-panel')).toBeVisible();
  await expect(page.locator('#result-count')).toContainText(
    new RegExp(`^${numeric.toLocaleString()}\\s*±\\s*${plusMinus}\\s*$`),
  );
});
test('Discover displays large number with ± and no space', async ({ page }) => {
  // Given
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
  const bigNumberSync = { '\\_studies_consents\\': '1477888±3' };
  await mockApiSuccess(page, '*/**/picsure/query/sync', bigNumberSync);
  await page.goto('/discover?search=somedata');

  // When
  await clickNthFilterIcon(page);
  const firstItem = await getOption(page);
  await firstItem.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();

  // Then
  await expect(page.locator('#results-panel')).toBeVisible();
  await expect(page.locator('#result-count')).toContainText(
    new RegExp('^1,477,888\\s*±\\s*3\\s*$'),
  );
});
test('Discover can display < 10', async ({ page }) => {
  // Given
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
  await mockApiSuccess(page, '*/**/picsure/query/sync', crossCountSyncResponseLessThan10);
  await page.goto('/discover?search=somedata');

  // When
  await clickNthFilterIcon(page);
  const firstItem = await getOption(page);
  await firstItem.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();

  // Then
  await expect(page.locator('#results-panel')).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText('< 10');
});
test('Search results with allowFiltering false are not filterable', async ({ page }) => {
  // Given
  await mockApiSuccess(page, '*/**/picsure/query/sync', '9999');
  await page.goto('/discover?search=somedata');

  // When
  const filterIcon = await nthFilterIcon(page, 6);

  // Then
  await expect(filterIcon).toBeVisible();
  await expect(filterIcon).toBeDisabled();
});
test('Search results with allowFiltering true are filterable', async ({ page }) => {
  // Given
  await mockApiSuccess(page, '*/**/picsure/query/sync', '9999');
  await page.goto('/discover?search=somedata');

  // When
  const filterIcon = await nthFilterIcon(page, 5);

  // Then
  await expect(filterIcon).toBeVisible();
  await expect(filterIcon).not.toBeDisabled();
});

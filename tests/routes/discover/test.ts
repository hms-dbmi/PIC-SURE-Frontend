import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
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
} from '../../mock-data';
import { getOption, nthFilterIcon, clickNthFilterIcon } from '../../utils';

test.use({ storageState: 'tests/.auth/unauthenticated.json' });

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
  const resultArray = crossCountSyncResponsePlus3['\\_studies_consents\\'].split(' ');
  const resultCount = parseInt(resultArray[0]) || 0;
  const suffix = resultArray[1];

  // Then
  await expect(page.locator('#results-panel')).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText(
    `${resultCount?.toLocaleString()} ${suffix}`,
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

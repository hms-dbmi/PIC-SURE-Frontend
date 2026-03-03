import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import { getOption, clickNthFilterIcon } from '../../utils';

import {
  conceptsDetailPath,
  detailResponseCat,
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
} from '../../mock-data';

const SYNC_URL = '*/**/picsure/v3/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, searchResultPath, mockData);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
});

test('Cohort Details button is visible', async ({ page }) => {
  // Given
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, SYNC_URL, '9999');
  await page.goto('/explorer?search=somedata');

  // When
  await clickNthFilterIcon(page);
  const firstItem = await getOption(page);
  await firstItem.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();

  // Then
  await expect(page.getByTestId('cohort-details-btn')).toBeVisible();
  await expect(page.getByTestId('cohort-details-btn')).toBeEnabled();
});
test('Cohort Details page loads', async ({ page }) => {
  // Given
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, SYNC_URL, '9999');
  await page.goto('/explorer?search=somedata');
  await clickNthFilterIcon(page);
  const firstItem = await getOption(page);
  await firstItem.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();

  // When
  await page.getByTestId('cohort-details-btn').click();

  // Then
  await expect(page.locator('#page-content')).toContainText('Cohort Details');
});
test('Cohort Details loads result total and site total', async ({ page }) => {
  // Given
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, SYNC_URL, '9999');
  await page.goto('/explorer?search=somedata');
  await clickNthFilterIcon(page);
  const firstItem = await getOption(page);
  await firstItem.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();

  // When
  await page.getByTestId('cohort-details-btn').click();

  // Then
  const tableCells = page.locator('table tbody tr').first().locator('td');
  await expect(tableCells.nth(1)).toContainText('9,999');
  await expect(tableCells.nth(2)).toContainText('9,999');
});

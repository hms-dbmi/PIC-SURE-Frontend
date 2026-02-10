import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../custom-context';
import {
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCatSameDataset,
} from '../mock-data';
import { clickNthFilterIcon, getOption } from '../utils';

const SYNC_URL = '*/**/picsure/query/sync';

test.describe('Advanced Filtering - Tool Suite', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, SYNC_URL, '9999');
  });

  test('AF-TOOL-001: Tool Suite contains an Advanced Filtering item with sliders icon', async ({
    page,
  }) => {
    // Navigate to the explorer page
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');

    // Add first filter via row 0
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('add-filter').click();

    // Re-mock detail endpoint for the second row's data
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );

    // Add second filter via row 1
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('add-filter').click();

    // Wait for the results panel to be visible
    await expect(page.locator('#results-panel')).toBeVisible();

    // Verify the Tool Suite heading is visible
    await expect(page.getByText('Tool Suite')).toBeVisible();

    // Verify the Advanced Filtering button exists in the Tool Suite
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeVisible();

    // Verify the button title is "Advanced Filtering"
    await expect(advancedFilteringBtn).toContainText('Advanced Filtering');

    // Verify the icon is the Font Awesome sliders icon (fa-sliders)
    const icon = advancedFilteringBtn.locator('i.fa-sliders');
    await expect(icon).toBeVisible();
  });
});

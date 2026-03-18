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

  test('AF-TOOL-002: Advanced Filtering tool is disabled when no filters are added', async ({
    page,
  }) => {
    await page.goto('/explorer?search=somedata');

    // Open the side panel (it starts closed when no filters exist)
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible();

    // Verify the Advanced Filtering button is visible but disabled
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeVisible();
    await expect(advancedFilteringBtn).toBeDisabled();
  });

  test('AF-TOOL-003: Advanced Filtering tool becomes enabled when a second filter is added', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');

    // Open the side panel (it starts closed when no filters exist)
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible();

    // Verify button starts disabled
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeVisible();
    await expect(advancedFilteringBtn).toBeDisabled();

    // Add first filter — button should still be disabled (needs > 1)
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('add-filter').click();
    await expect(advancedFilteringBtn).toBeDisabled();

    // Add second filter
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('add-filter').click();

    // Verify the button is now enabled
    await expect(advancedFilteringBtn).toBeEnabled();
  });

  test('AF-TOOL-004: Clicking Advanced Filtering tool navigates to the Advanced Filtering page', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');

    // Add two filters to enable the button
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('add-filter').click();

    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('add-filter').click();

    // Click the Advanced Filtering button
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeEnabled();
    await advancedFilteringBtn.click();

    // Verify the Advanced Filtering page opens
    await page.waitForURL(/\/explorer\/advanced-filtering/);
    await expect(page.getByRole('heading', { name: 'Advanced Filtering' })).toBeVisible();
  });

  test('AF-APPLY-004: Clicking Apply to Query triggers query execution with updated filter structure', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');

    // Add first filter
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('add-filter').click();

    // Add second filter (need 2 for AND/OR controls to appear)
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('add-filter').click();

    // Wait for results panel to appear
    await expect(page.locator('#results-panel')).toBeVisible();

    // Navigate to the Advanced Filtering page
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeEnabled();
    await advancedFilteringBtn.click();

    await page.waitForURL(/\/explorer\/advanced-filtering/);
    await expect(page.getByRole('heading', { name: 'Advanced Filtering' })).toBeVisible();

    // Make a visible change: switch root operator from AND to OR
    const orRadio = page.getByRole('radio', { name: 'OR' }).first();
    await expect(orRadio).toBeVisible();
    await orRadio.locator('..').click();

    // Click Apply Changes (this applies and navigates back to /explorer)
    const applyBtn = page.getByRole('button', { name: 'Apply Changes' });
    await applyBtn.click();

    // Verify navigated back to explorer
    await page.waitForURL(/\/explorer(\?|$)/);
    await expect(advancedFilteringBtn).toBeVisible();

    // Verify the OR operator was applied by checking the filter display
    await expect(page.locator('#results-panel')).toContainText('OR');
  });
});

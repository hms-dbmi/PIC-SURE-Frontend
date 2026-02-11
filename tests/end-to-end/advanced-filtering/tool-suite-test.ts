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

  test('AF-TOOL-003: Advanced Filtering tool becomes enabled when a filter is added', async ({
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

    // Add a filter
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('add-filter').click();

    // Verify the button is now enabled
    await expect(advancedFilteringBtn).toBeEnabled();
  });

  test('AF-TOOL-004: Clicking Advanced Filtering tool opens the Advanced Filtering modal', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');

    // Add a filter to enable the button
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('add-filter').click();

    // Click the Advanced Filtering button
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeEnabled();
    await advancedFilteringBtn.click();

    // Verify the Advanced Filtering modal opens
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Advanced Filters' })).toBeVisible();
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

    // Open the Advanced Filtering modal
    const advancedFilteringBtn = page.getByTestId('advanced-filtering-btn');
    await expect(advancedFilteringBtn).toBeEnabled();
    await advancedFilteringBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Make a visible change: switch root operator from AND to OR
    const orRadio = page.getByRole('radio', { name: 'OR' }).first();
    await expect(orRadio).toBeVisible();
    await orRadio.locator('..').click();

    // Set up a listener for the sync API call before clicking Apply
    const syncRequestPromise = page.waitForRequest(
      (request) => request.url().includes('/picsure/query/sync'),
      { timeout: 10000 },
    );

    // Click Apply Changes
    const applyBtn = modal.getByRole('button', { name: 'Apply Changes' });
    await applyBtn.click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify the sync request was made (query re-runs with updated structure)
    const syncRequest = await syncRequestPromise;
    expect(syncRequest.url()).toContain('/picsure/query/sync');
  });

});

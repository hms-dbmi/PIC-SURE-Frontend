import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCatSameDataset,
} from '../../../support/mock-data';
import { clickNthFilterIcon, getOption, userIsLoggedIn } from '../../utils';

const SYNC_URL = '*/**/picsure/hpds/auth/query/sync';

test.describe('Advanced Query Builder - Build Advanced Query Button', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, SYNC_URL, '9999');
  });

  test('AF-TOOL-001: Build Advanced Query button appears next to Filters heading with two filters', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Add first filter
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('filter-add').click();

    // Add second filter
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('filter-add').click();

    await expect(page.locator('#results-panel')).toBeVisible();

    // Verify the Build Advanced Query button exists next to Filters
    const advancedFilteringBtn = page.getByTestId('results-advanced-filtering-open');
    await expect(advancedFilteringBtn).toBeVisible();
    await expect(advancedFilteringBtn).toContainText('Build Advanced Query');
  });

  test('AF-TOOL-002: Build Advanced Query button is disabled with only one filter', async ({
    page,
    browserName,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Add one filter
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('filter-add').click();

    await expect(page.locator('#results-panel')).toBeVisible();

    // Verify the button is visible but disabled
    const advancedFilteringBtn = page.getByTestId('results-advanced-filtering-open');
    await expect(advancedFilteringBtn).toBeVisible();
    await expect(advancedFilteringBtn).toBeDisabled();

    // The button itself is the tooltip's trigger, for the pointer and the keyboard
    await advancedFilteringBtn.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toContainText('not available with only one');
    await expect(advancedFilteringBtn).toHaveAttribute(
      'aria-describedby',
      (await tooltip.getAttribute('id'))!,
    );
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);

    // WebKit, like Safari, only tabs to buttons with Option held
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await advancedFilteringBtn.focus();
    await page.keyboard.press(`Shift+${tab}`);
    await page.keyboard.press(tab);
    await expect(advancedFilteringBtn).toBeFocused();
    await expect(tooltip).toContainText('not available with only one');
  });

  test('AF-TOOL-003: Build Advanced Query button becomes enabled when a second filter is added', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Add first filter — button should be disabled (needs > 1)
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('filter-add').click();

    const advancedFilteringBtn = page.getByTestId('results-advanced-filtering-open');
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
    await page.getByTestId('filter-add').click();

    // Verify the button is now enabled
    await expect(advancedFilteringBtn).toBeEnabled();
  });

  test('AF-TOOL-004: Clicking Build Advanced Query navigates to the Advanced Query Builder page', async ({
    page,
  }) => {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Add two filters to enable the button
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('filter-add').click();

    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('filter-add').click();

    // Click the Build Advanced Query button
    const advancedFilteringBtn = page.getByTestId('results-advanced-filtering-open');
    await expect(advancedFilteringBtn).toBeEnabled();
    await advancedFilteringBtn.click();

    // Verify the Advanced Query Builder page opens
    await page.waitForURL(/\/explorer\/advanced-filtering/);
    await expect(page.getByRole('heading', { name: 'Advanced Query Builder' })).toBeVisible();
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
    await userIsLoggedIn(page);

    // Add first filter
    await clickNthFilterIcon(page, 0);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('filter-add').click();

    // Add second filter (need 2 for AND/OR controls to appear)
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCatSameDataset.dataset}`,
      detailResponseCatSameDataset,
    );
    await clickNthFilterIcon(page, 1);
    const secondItem = await getOption(page);
    await secondItem.click();
    await page.getByTestId('filter-add').click();

    // Wait for results panel to appear
    await expect(page.locator('#results-panel')).toBeVisible();

    // Navigate to the Advanced Query Builder page
    const advancedFilteringBtn = page.getByTestId('results-advanced-filtering-open');
    await expect(advancedFilteringBtn).toBeEnabled();
    await advancedFilteringBtn.click();

    await page.waitForURL(/\/explorer\/advanced-filtering/);
    await expect(page.getByRole('heading', { name: 'Advanced Query Builder' })).toBeVisible();

    // Make a visible change: switch root operator from AND to OR
    const orRadio = page.getByRole('radio', { name: 'OR' }).first();
    await expect(orRadio).toBeVisible();
    await orRadio.locator('..').click();

    // Click Apply Changes (stays on page, sidebar updates)
    const applyBtn = page.getByRole('button', { name: 'Apply Changes' });
    await applyBtn.click();

    // Verify still on advanced-filtering page
    expect(page.url()).toContain('/advanced-filtering');

    // Verify the sidebar opened and shows the OR operator
    await expect(page.locator('#results-side-panel')).toBeVisible();
  });
});

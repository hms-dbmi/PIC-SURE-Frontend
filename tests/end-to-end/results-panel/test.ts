import { expect } from '@playwright/test';
import { test, mockApiFail, mockApiSuccess, mockApiConfig } from '../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
  crossCountSyncResponseInital,
} from '../mock-data';
import { getOption, userIsLoggedIn } from '../utils';

const countResultPath = '*/**/picsure/hpds/auth/query/sync';
const openCountResultPath = '*/**/picsure/hpds/open/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Results Panel', () => {
  test.beforeEach(({ page }) => mockApiConfig(page));
  test('Result panel bar and button shows', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#results-side-panel-bar')).toBeVisible();
    await expect(page.locator('#results-panel-toggle')).toBeVisible();
  });
  test('Result toggle button opens and closes the results panel', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    //When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();

    //When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).not.toBeVisible();
  });
  test('Result panel shows N/A icon on add filter error with popup', async ({ page }) => {
    // Given
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiFail(page, countResultPath, 'failed');
    await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
    await page
      .getByTestId('ui-options-selection-list-available')
      .locator('label:nth-child(1)')
      .click();
    await page.getByTestId('filter-add').click();

    // Then
    await expect(page.locator('#results-count')).toBeVisible();
    await expect(page.locator('#results-count')).toHaveText('N/A');
    const errorAlert = page.getByTestId('ui-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(
      'There was an error with your query. If this persists, please contact your PIC-SURE admin.',
    );
  });
  test('Result panel shows generic error on open with no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiFail(page, countResultPath, 'failed');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-count')).toBeVisible();
    const errorAlert = page.getByTestId('ui-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(
      'There was an error with your query. If this persists, please contact your PIC-SURE admin.',
    );
  });
  test('Result panel shows the correct number of results', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible();

    // Then
    await expect(page.locator('#results-count')).toBeVisible();
    await expect(page.locator('#results-count')).not.toHaveText('0');
  });
  test('Result panel shows no filters added when there are no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });
  test('Export button hidden when no filters or exports are added', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
    await expect(page.locator('#results-export-open')).not.toBeVisible();
  });
  test('Export button hidden when count is 0', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '0');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#results-export-open')).not.toBeVisible();
  });
  test('Export button hidden when filter error', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiFail(page, countResultPath, 'failed');
    await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
    await page
      .getByTestId('ui-options-selection-list-available')
      .locator('label:nth-child(1)')
      .click();
    await page.getByTestId('filter-add').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#results-export-open')).not.toBeVisible();
  });
  test('Export button hidden when count is not 0 and there is no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await mockApiSuccess(page, openCountResultPath, '9999');

    // When
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#results-count')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#results-export-open')).not.toBeVisible();
  });

  test('Export button disabled during counts loading then enabled after', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [{ name: 'ALLOW_EXPORT', value: 'true' }],
    });
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, openCountResultPath, '9999');
    // Hold the count for the two-filter query until the test has seen the disabled state
    let releaseCount!: () => void;
    const countHeld = new Promise<void>((resolve) => (releaseCount = resolve));
    let heldRequests = 0;
    await page.route(countResultPath, async (route) => {
      const body = JSON.stringify(route.request().postDataJSON());
      if (body.includes(JSON.stringify(detailResponseCat2.conceptPath))) {
        heldRequests += 1;
        await countHeld;
      }
      await route.fulfill({ json: '9999' });
    });
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#results-count')).toBeVisible({ timeout: 15000 });
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
    await page
      .getByTestId('ui-options-selection-list-available')
      .locator('label:nth-child(1)')
      .click();
    await page.getByTestId('filter-add').click();
    const exportButton = page.locator('#results-export-open');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Add second filter to trigger delayed counts and disabled state
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
      detailResponseCat2,
    );
    await page.locator('#explorer-table-row-2 button[title^=Filter]').click();
    await page.getByTestId('ui-options-selection-list-select-all').click();
    await page.getByTestId('filter-add').click();

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeDisabled();
    await expect.poll(() => heldRequests).toBeGreaterThan(0);
    // Then the button enables once the count arrives
    releaseCount();
    await expect(page.locator('#results-count-number')).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });
  test('Clear All clears exports and filters', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [{ name: 'ALLOW_EXPORT_ENABLED', value: 'true' }],
    });
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=age');
    await userIsLoggedIn(page);

    const expectedRowIds = mockData.content.map((row) => row.conceptPath);
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();

    const firstRow = tableBody.locator('tr').nth(0);
    const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
    await filterIcon.click();
    const firstFilter = await getOption(page);
    await firstFilter.click();
    const addFilterButton = page.getByTestId('filter-add');
    await addFilterButton.click();
    await expect(page.getByTestId(`results-filter-item-${expectedRowIds[0]}`)).toBeVisible();

    const secondRow = tableBody.locator('tr').nth(1);
    const exportButton = secondRow.locator('td').last().locator('button').last();
    await exportButton.click();
    await expect(page.getByTestId(`results-export-item-${expectedRowIds[1]}`)).toBeVisible();

    // When
    await page.getByTestId('results-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes' }).click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });

  test.describe('Filter Tree Display', () => {
    test.beforeEach(async ({ page }) => {
      // DIST_EXPLORER gates the distributions-btn on both /explorer and /discover
      // (ResultsPanel.svelte's showExplorerDistributions/showDiscoverDistributions).
      await mockApiConfig(page, {
        features: [{ name: 'DIST_EXPLORER', value: 'true' }],
      });
    });

    test('shows distributions button when filters are added', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, openCountResultPath, { '\\_studies_consents\\': 9999 });
      // Override the shared beforeEach config: DISCOVER keeps /discover from
      // redirecting, OPEN_EXPLORER:false routes counts through openCountResultPath.
      await mockApiConfig(page, {
        features: [
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
      });
      await page.goto('/discover?search=somedata');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
      await page
        .getByTestId('ui-options-selection-list-available')
        .locator('label:nth-child(1)')
        .click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('filter-add');
      await addFilterButton.click();
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#explorer-table-row-2 button[title^=Filter]').click();
      await page
        .getByTestId('ui-options-selection-list-available')
        .locator('label:nth-child(1)')
        .click();
      const secondItem = await getOption(page);
      await secondItem.click();
      const addFilterButton2 = page.getByTestId('filter-add');
      await addFilterButton2.click();

      // Then
      await expect(page.getByTestId('results-distributions-open')).not.toBeDisabled();
    });

    test('disables distributions button on Explore when total cohort count is zero', async ({
      page,
    }) => {
      // Given
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '0');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // When
      await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('filter-add').click();

      // Then
      await expect(page.getByTestId('results-distributions-open')).toBeDisabled();
    });

    test('re-enables distributions button when removing a zero-count filter restores cached counts', async ({
      page,
    }) => {
      // Given
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      let countCalls = 0;
      await page.route(countResultPath, async (route) => {
        countCalls += 1;
        await route.fulfill({ json: countCalls >= 2 ? '0' : '9999' });
      });

      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('filter-add').click();
      await expect(page.locator('#results-count-number')).toHaveText('9,999');
      await expect(page.getByTestId('results-distributions-open')).toBeEnabled();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#explorer-table-row-2 button[title^=Filter]').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await page.getByTestId('filter-add').click();
      await expect(page.locator('#results-count-number')).toHaveText('0');
      await expect(page.getByTestId('results-distributions-open')).toBeDisabled();

      // When
      await page
        .getByTestId(`results-filter-item-${detailResponseCat2.conceptPath}`)
        .getByRole('button', { name: 'Remove Filter' })
        .click();

      // Then: the previous one-filter query is served from cache; button state should follow it.
      await expect(page.locator('#results-count-number')).toHaveText('9,999');
      await expect(page.getByTestId('results-distributions-open')).toBeEnabled();
    });

    test('disables distributions button on Discover when total cohort count is less than ten', async ({
      page,
    }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, openCountResultPath, { '\\_studies_consents\\': '< 10' });
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      // Override the shared beforeEach config: DISCOVER keeps /discover from
      // redirecting, OPEN_EXPLORER:false routes counts through openCountResultPath.
      await mockApiConfig(page, {
        features: [
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
      });
      await page.goto('/discover?search=somedata');
      await userIsLoggedIn(page);

      // When
      await page.locator('#explorer-table-row-0 button[title^=Filter]').click();
      await page
        .getByTestId('ui-options-selection-list-available')
        .locator('label:nth-child(1)')
        .click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('filter-add').click();

      // Then
      await expect(page.getByTestId('results-distributions-open')).toBeDisabled();
    });
  });
});

import { expect, type Page } from '@playwright/test';
import { test, mockApiFail, mockApiSuccess } from '../custom-context';
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
import { getOption } from '../utils';

const countResultPath = '*/**/picsure/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Results Panel', () => {
  test('Result panel bar and button shows', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.locator('#side-panel-bar')).toBeVisible();
    await expect(page.locator('#results-panel-toggle')).toBeVisible();
    await page.locator('#results-panel-toggle').click();
  });
  test('Result toggle button opens and closes the results panel', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

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
    await page.locator('#results-panel-toggle').click();

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiFail(page, countResultPath, 'failed');
    await page.locator('#row-0 button[title=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('N/A');
    const errorAlert = page.getByTestId('error-alert');
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

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    const errorAlert = page.getByTestId('error-alert');
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
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).not.toHaveText('0');
  });
  test('Result panel shows no filters added when there are no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });
  test('Export button hidden when no filters or exports are added', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when count is 0', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '0');
    await page.goto('/explorer?search=somedata');

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when filter error', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiFail(page, countResultPath, 'failed');
    await page.locator('#row-0 button[title=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when count is not 0 and there is no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');

    // When
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });

  test('Export button disabled during counts loading then enabled after', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    // Deterministic counts: fast for initial and first filter, delayed after second filter
    let countCalls = 0;
    await page.route(countResultPath, async (route) => {
      countCalls += 1;
      if (countCalls >= 3) {
        await new Promise((r) => setTimeout(r, 1500));
      }
      await route.fulfill({ json: '9999' });
    });
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.locator('#row-0 button[title=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();
    const exportButton = page.locator('#export-data-button');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Add second filter to trigger delayed counts and disabled state
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
      detailResponseCat2,
    );
    await page.locator('#row-2 button[title=Filter]').click();
    await page.locator('#select-all').click();
    await page.getByTestId('add-filter').click();

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeDisabled();
    // Then eventually counts finish and button becomes enabled
    const resultCountNumber = page.locator('#result-count-number');
    await expect(resultCountNumber).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });
  test('Clear All clears exports and filters', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=age');

    const expectedRowIds = mockData.content.map((row) => row.conceptPath);
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();

    const firstRow = tableBody.locator('tr').nth(0);
    const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
    await filterIcon.click();
    const firstFilter = await getOption(page);
    await firstFilter.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();
    await expect(page.getByTestId(`added-filter-${expectedRowIds[0]}`)).toBeVisible();

    const secondRow = tableBody.locator('tr').nth(1);
    const exportButton = secondRow.locator('td').last().locator('button').last();
    await exportButton.click();
    await expect(page.getByTestId(`added-export-${expectedRowIds[1]}`)).toBeVisible();

    // When
    await page.getByTestId('clear-all-results-btn').click();
    await page.locator('#modal-component').getByRole('button', { name: 'Yes' }).click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });
  test.describe('Discover OR', () => {
    let querySyncRequest: string[] = [];

    test.beforeEach(({ page }) => {
      page.on('request', (request) => {
        if (
          request.url().includes('/picsure/query/sync') ||
          request.url().includes('/picsure/v3/query/sync')
        ) {
          const data = request.postData();
          if (data !== null) {
            querySyncRequest.push(data);
          }
        }
      });
    });

    test.afterEach(() => {
      querySyncRequest = [];
    });
    test('shows distributions button when there are no OR filter groups', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      const addFilterButton2 = page.getByTestId('add-filter');
      await addFilterButton2.click();

      // Then
      expect(page.getByTestId('distributions-btn')).not.toBeDisabled();
    });
    test('disables distributions button when there are OR filter groups', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      const addFilterButton2 = page.getByTestId('add-filter');
      await addFilterButton2.click();
      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      // Then
      expect(page.getByTestId('distributions-btn')).toBeDisabled();
    });

    test('sends request with QueryV3 structure', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.goto('/discover?search=somedata');

      // When
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);

      // Then
      expect(querySyncRequest.length).toBeGreaterThanOrEqual(1);
      const lastRequest = querySyncRequest[querySyncRequest.length - 1];
      expect(lastRequest).toContain('phenotypicClauses');
    });
    test('if there is only one filter, there should be no dropdown', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.goto('/discover?search=somedata');

      // When
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);
      // Then
      const dropdowns = await page.locator('#export-filters .operator-select').all();
      expect(dropdowns.length).toBe(0);
    });
    test('dropdown appears between pheno filters', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');

      // When
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      let addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      // Then
      await expect(page.locator('#results-panel')).toBeVisible();
      const dropdowns = await page.locator('#export-filters .operator-select').all();
      expect(dropdowns.length).toBe(1);
    });
    test('can dropdown value be changed', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      const addFilterButton2 = page.getByTestId('add-filter');
      await addFilterButton2.click();

      // When
      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      // Then
      expect(querySyncRequest.length).toBeGreaterThanOrEqual(3);
      expect(dropdowns[0]).toHaveValue('OR');
      expect(querySyncRequest[querySyncRequest.length - 1]).toContain('operator":"OR');
    });
    test('when a dropdown changes, the count is re-evaluated -> query has new value', async ({
      page,
    }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      const addFilterButton2 = page.getByTestId('add-filter');
      await addFilterButton2.click();

      // When
      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      // Then
      expect(querySyncRequest.length).toBe(5);
      expect(querySyncRequest[querySyncRequest.length - 2]).not.toBe(
        querySyncRequest[querySyncRequest.length - 1],
      );
    });
    test('ensure or group is displayed correctly', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      let addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      await enableAdvancedFiltering(page);
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();

      // When
      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      // Then
      const orSubGroups = await page
        .locator('#export-filters .filter-group-and .filter-group-or')
        .all();
      expect(orSubGroups.length).toBe(1);
    });
  });

  const enableAdvancedFiltering = async (page: Page) => {
    const toggle = page.getByTestId('switch');
    await toggle.click();
    await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();
  };

  test.describe('Advanced Filtering Toggle', () => {
    test('toggle appears when filters are added', async ({ page }) => {
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      await expect(page.getByTestId('switch')).toBeVisible();
      await expect(page.getByTestId('advanced-filtering-beta-chip')).toBeVisible();
      await expect(page.getByTestId('advanced-filtering-beta-chip')).toHaveText('Beta');
    });

    test('toggle does not appear when no filters are added', async ({ page }) => {
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await expect(page.getByTestId('switch')).not.toBeVisible();
    });

    test('enabling toggle shows modal with help desk link', async ({ page }) => {
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      const toggle = page.getByTestId('switch');
      await toggle.click();

      await expect(page.locator('#modal-component')).toBeVisible();
      await expect(
        page.locator('#modal-component').getByText('Advanced Filtering is now enabled'),
      ).toBeVisible();
      await expect(
        page
          .locator('#modal-component')
          .getByText('With Advanced Filtering, you can build more complex queries'),
      ).toBeVisible();
      await expect(
        page.locator('#modal-component').getByRole('link', { name: 'Let us know' }),
      ).toBeVisible();

      const proceedButton = page
        .locator('#modal-component')
        .getByRole('button', { name: 'Proceed' });
      await expect(proceedButton).toBeVisible();
      await proceedButton.click();

      await expect(page.locator('#modal-component')).not.toBeVisible();
    });

    test('disabling toggle without OR filters does not show modal', async ({ page }) => {
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      const toggle = page.getByTestId('switch');
      await toggle.click();

      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      await toggle.click();

      await expect(page.locator('#modal-component')).not.toBeVisible();
    });

    test('disabling toggle with OR filters shows confirmation modal', async ({ page }) => {
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await page.getByTestId('add-filter').click();

      const toggle = page.getByTestId('switch');
      await toggle.click();
      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      await toggle.click();

      await expect(page.locator('#modal-component')).toBeVisible();
      await expect(
        page.locator('#modal-component').getByText('Advanced Filtering will be removed'),
      ).toBeVisible();
      await expect(
        page
          .locator('#modal-component')
          .getByText('This will remove any "or" filters and filter groups you have added'),
      ).toBeVisible();

      const cancelButton = page.locator('#modal-component').getByRole('button', { name: 'Cancel' });
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      await expect(page.locator('#modal-component')).not.toBeVisible();
      await expect(toggle).toBeChecked();
    });

    test('proceeding to disable advanced filtering converts OR to AND', async ({ page }) => {
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await page.getByTestId('add-filter').click();

      const toggle = page.getByTestId('switch');
      await toggle.click();
      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      await toggle.click();
      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      await expect(toggle).not.toBeChecked();
      const orSubGroups = await page
        .locator('#export-filters .filter-group-and .filter-group-or')
        .all();
      expect(orSubGroups.length).toBe(0);
    });
    test('Reenabling advanced filtering after disabling converts allows ORs again', async ({
      page,
    }) => {
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await page.goto('/discover?search=somedata');
      await page.locator('#results-panel-toggle').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await page.getByTestId('add-filter').click();

      const toggle = page.getByTestId('switch');
      await toggle.click();
      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      const dropdowns = await page.locator('#export-filters .operator-select').all();
      await dropdowns[0].selectOption('OR');

      await toggle.click();
      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      await expect(toggle).not.toBeChecked();
      const orSubGroups = await page
        .locator('#export-filters .filter-group-and .filter-group-or')
        .all();
      expect(orSubGroups.length).toBe(0);

      await toggle.click();
      await page.locator('#modal-component').getByRole('button', { name: 'Proceed' }).click();

      await expect(toggle).toBeChecked();
    });
  });
});

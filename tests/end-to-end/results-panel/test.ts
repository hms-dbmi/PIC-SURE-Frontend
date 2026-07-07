import { expect } from '@playwright/test';
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
import { getOption, userIsLoggedIn } from '../utils';

const countResultPath = '*/**/picsure/v3/query/sync';
const openCountResultPath = '*/**/picsure/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Results Panel', () => {
  test.beforeEach(({ page }) => mockApiSuccess(page, '*/**/api/config', { features: [], settings: [] }));
  test('Result panel bar and button shows', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

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
    await userIsLoggedIn(page);

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
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible();

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
    await expect(page.locator('#export-data-button')).not.toBeVisible();
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
    await expect(page.locator('#export-data-button')).not.toBeVisible();
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
    await mockApiSuccess(page, openCountResultPath, '9999');

    // When
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#result-count')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });

  test('Export button disabled during counts loading then enabled after', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/api/config', {
      features: [{ name: 'ALLOW_EXPORT', value: 'true' }],
      settings: [],
    });
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, openCountResultPath, '9999');
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
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#result-count')).toBeVisible({ timeout: 15000 });
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
    await mockApiSuccess(page, '*/**/api/config', {
      features: [{ name: 'ALLOW_EXPORT_ENABLED', value: 'true' }],
      settings: [],
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

  test.describe('Filter Tree Display', () => {
    let querySyncRequest: string[] = [];

    test.beforeEach(async ({ page }) => {
      // DIST_EXPLORER gates the distributions-btn on both /explorer and /discover
      // (ResultsPanel.svelte's showExplorerDistributions/showDiscoverDistributions).
      await mockApiSuccess(page, '*/**/api/config', {
        features: [
          { name: 'ENABLE_OR_QUERIES', value: 'true' },
          { name: 'DIST_EXPLORER', value: 'true' },
        ],
        settings: [],
      });
      page.on('request', (request) => {
        if (request.url().includes('/picsure/query/sync')) {
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

    test('shows distributions button when filters are added', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, openCountResultPath, { '\\_studies_consents\\': 9999 });
      // Override the shared beforeEach config: DISCOVER keeps /discover from
      // redirecting, OPEN_EXPLORER:false routes counts through openCountResultPath.
      await mockApiSuccess(page, '*/**/api/config', {
        features: [
          { name: 'ENABLE_OR_QUERIES', value: 'true' },
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
        settings: [],
      });
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
      await expect(page.getByTestId('distributions-btn')).not.toBeDisabled();
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
      await page.locator('#row-0 button[title=Filter]').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      // Then
      await expect(page.getByTestId('distributions-btn')).toBeDisabled();
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
      await page.locator('#row-0 button[title=Filter]').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();
      await expect(page.locator('#result-count-number')).toHaveText('9,999');
      await expect(page.getByTestId('distributions-btn')).toBeEnabled();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
        detailResponseCat2,
      );
      await page.locator('#row-2 button[title=Filter]').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await page.getByTestId('add-filter').click();
      await expect(page.locator('#result-count-number')).toHaveText('0');
      await expect(page.getByTestId('distributions-btn')).toBeDisabled();

      // When
      await page
        .getByTestId(`added-filter-${detailResponseCat2.conceptPath}`)
        .getByRole('button', { name: 'Remove Filter' })
        .click();

      // Then: the previous one-filter query is served from cache; button state should follow it.
      await expect(page.locator('#result-count-number')).toHaveText('9,999');
      await expect(page.getByTestId('distributions-btn')).toBeEnabled();
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
      await mockApiSuccess(page, '*/**/api/config', {
        features: [
          { name: 'ENABLE_OR_QUERIES', value: 'true' },
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
        settings: [],
      });
      await page.goto('/discover?search=somedata');
      await userIsLoggedIn(page);

      // When
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await page.getByTestId('add-filter').click();

      // Then
      await expect(page.getByTestId('distributions-btn')).toBeDisabled();
    });

    test('sends request with QueryV3 structure', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, openCountResultPath, '9999');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      // Override the shared beforeEach config: DISCOVER keeps /discover from
      // redirecting, OPEN_EXPLORER:false routes counts through openCountResultPath.
      await mockApiSuccess(page, '*/**/api/config', {
        features: [
          { name: 'ENABLE_OR_QUERIES', value: 'true' },
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
        settings: [],
      });
      await page.goto('/discover?search=somedata');

      // When
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();

      // Then
      expect(querySyncRequest.length).toBe(1);
      expect(querySyncRequest[0]).toContain('phenotypicClauses');
    });
    test('single filter shows no operator label', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, openCountResultPath, '9999');
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      // Override the shared beforeEach config: DISCOVER keeps /discover from
      // redirecting, OPEN_EXPLORER:false routes counts through openCountResultPath.
      await mockApiSuccess(page, '*/**/api/config', {
        features: [
          { name: 'ENABLE_OR_QUERIES', value: 'true' },
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
        settings: [],
      });
      await page.goto('/discover?search=somedata');

      // When
      await page.locator('#row-0 button[title=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();

      // Then
      await expect(page.getByTestId('operator-label')).toHaveCount(0);
    });
    test('AND label appears between filters', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, openCountResultPath, '9999');
      // Override the shared beforeEach config: DISCOVER keeps /discover from
      // redirecting, OPEN_EXPLORER:false routes counts through openCountResultPath.
      await mockApiSuccess(page, '*/**/api/config', {
        features: [
          { name: 'ENABLE_OR_QUERIES', value: 'true' },
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
        settings: [],
      });
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
      await expect(page.getByTestId('operator-label')).toHaveCount(1);
      await expect(page.getByTestId('operator-label').first()).toHaveText('AND');
    });
  });
});

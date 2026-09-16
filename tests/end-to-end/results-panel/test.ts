import { expect, type Page } from '@playwright/test';
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
import { getOption, navigateInApp, seedGenomicFilter, userIsLoggedIn } from '../utils';

const countResultPath = '*/**/picsure/hpds/auth/v3/query/sync';
const openCountResultPath = '*/**/picsure/hpds/open/v3/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Results Panel', () => {
  test.beforeEach(({ page }) => mockApiConfig(page));
  test('Collapsed strip shows the participant count and the empty filter message', async ({
    page,
  }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then
    const strip = page.getByTestId('results-summary-strip');
    await expect(strip).toBeVisible();
    await expect(strip).toHaveAttribute('aria-expanded', 'false');
    await expect(strip).toHaveAttribute('aria-controls', 'results-panel-body');
    await expect(page.getByTestId('results-panel-count')).toContainText('9,999');
    await expect(page.getByTestId('results-panel-filter-count')).toHaveText(
      'No filters added, add below',
    );
    await expect(page.locator('#results-panel')).not.toBeVisible();
  });
  test('Strip is not rendered on the export and distributions routes', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await expect(page.getByTestId('results-summary-panel')).toBeVisible();

    // Then
    await page.goto('/explorer/distributions');
    await expect(page.getByRole('heading', { name: 'Variable Distributions' })).toBeVisible();
    await expect(page.getByTestId('results-summary-panel')).toHaveCount(0);

    await page.goto('/explorer/export');
    await expect(
      page.getByRole('heading', { name: 'Export Data for Research Analysis' }),
    ).toBeVisible();
    await expect(page.getByTestId('results-summary-panel')).toHaveCount(0);
  });
  test('Counts do not load where the strip does not render, and resume when it returns', async ({
    page,
  }) => {
    // Given - the /explorer layout spans this route, so the panel component is alive on it.
    // The count subscription has to follow the strip being shown, not the layout mounting.
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    let countRequests = 0;
    await page.route(countResultPath, async (route) => {
      countRequests += 1;
      await route.fulfill({ json: '9999' });
    });

    // When
    await page.goto('/explorer/distributions');
    await userIsLoggedIn(page);
    await expect(page.getByRole('heading', { name: 'Variable Distributions' })).toBeVisible();

    // Then
    await expect(page.getByTestId('results-summary-panel')).toHaveCount(0);
    expect(countRequests).toBe(0);

    // When - back to Explore without a reload, so the component is the same instance
    await page.getByRole('button', { name: 'Back to Explore' }).click();

    // Then
    await expect(page.getByTestId('results-panel-count')).toContainText('9,999');
    expect(countRequests).toBe(1);
  });
  test('Strip pluralises the filter count', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.getByTestId('results-panel-filter-count')).toHaveText('1 filter added');

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
      detailResponseCat2,
    );
    await page.locator('#ExplorerTable-row-2 button[title^=Filter]').click();
    await page.locator('#select-all').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.getByTestId('results-panel-filter-count')).toHaveText('2 filters added');
  });
  test('Clicking the strip opens and closes the results panel body', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    const strip = page.getByTestId('results-summary-strip');

    //When
    await strip.click();

    // Then
    await expect(page.getByTestId('results-panel-body')).toBeVisible();
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(strip).toHaveAttribute('aria-expanded', 'true');

    //When
    await strip.click();

    // Then
    await expect(page.locator('#results-panel')).not.toBeVisible();
    await expect(strip).toHaveAttribute('aria-expanded', 'false');
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
    await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('N/A');
    const errorAlert = page.getByTestId('count-error-alert');
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
    const errorAlert = page.getByTestId('count-error-alert');
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
    await expect(
      page.getByTestId('results-panel-body').getByText('No filters added'),
    ).toBeVisible();
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
    await expect(
      page.getByTestId('results-panel-body').getByText('No filters added'),
    ).toBeVisible();
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
    await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
    await mockApiConfig(page, {
      features: [{ name: 'ALLOW_EXPORT', value: 'true' }],
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
    await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
    await page.locator('#ExplorerTable-row-2 button[title^=Filter]').click();
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
    await expect(
      page.getByTestId('results-panel-body').getByText('No filters added'),
    ).toBeVisible();
  });

  test.describe('Server render', () => {
    // No JS, so this is the first paint before hydration. OPEN + OPEN_EXPLORER is what makes
    // the shell render server-side for an unauthenticated visitor.
    test.use({ javaScriptEnabled: false });

    test('shows a pending count, not the error value', async ({ page }) => {
      // Given
      await mockApiConfig(page, {
        features: [
          { name: 'OPEN', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
        ],
      });

      // When
      await page.goto('/discover');

      // Then - nothing has been asked for yet, which is not the same as having failed
      const strip = page.getByTestId('results-summary-panel');
      await expect(strip).toHaveCount(1);
      await expect(strip.locator('#result-count')).not.toHaveText('N/A');
      await expect(page.getByTestId('results-panel-count')).toContainText(
        'Loading participant count',
      );
    });
  });

  test.describe('Filter Tree Display', () => {
    let querySyncRequest: string[] = [];

    test.beforeEach(async ({ page }) => {
      // DIST_EXPLORER gates the distributions-btn on both /explorer and /discover
      // (ResultsPanel.svelte's showExplorerDistributions/showDiscoverDistributions).
      await mockApiConfig(page, {
        features: [{ name: 'DIST_EXPLORER', value: 'true' }],
      });
      page.on('request', (request) => {
        if (request.url().includes('/picsure/hpds/open/v3/query/sync')) {
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
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
      await page.locator('#ExplorerTable-row-2 button[title^=Filter]').click();
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
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
      // Call 1 is the panel's own no-filter count, which it now issues whether or not the
      // body is expanded. Calls 2 and 3 are the two filters the test adds.
      let countCalls = 0;
      await page.route(countResultPath, async (route) => {
        countCalls += 1;
        await route.fulfill({ json: countCalls >= 3 ? '0' : '9999' });
      });

      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
      await page.locator('#ExplorerTable-row-2 button[title^=Filter]').click();
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
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
      await mockApiConfig(page, {
        features: [
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
      });
      await page.goto('/discover?search=somedata');

      // When
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();

      // Then - the panel's no-filter count on page load comes first, so assert on the most
      // recent request rather than pinning a total that counts it.
      expect(querySyncRequest.at(-1)).toContain('phenotypicClauses');
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
      await mockApiConfig(page, {
        features: [
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
      });
      await page.goto('/discover?search=somedata');

      // When
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
      await mockApiConfig(page, {
        features: [
          { name: 'DIST_EXPLORER', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
      });
      await page.goto('/discover?search=somedata');

      // When
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await page.locator('#ExplorerTable-row-0 button[title^=Filter]').click();
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
      await page.locator('#ExplorerTable-row-2 button[title^=Filter]').click();
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

// The panel opens itself when the cohort gains something. Every test here would still pass
// with a permanently-open panel, so each one first pins the collapsed starting state - and
// none of them assert "filters exist" with an unanchored /filters? added/, which the
// zero-filter string "No filters added, add below" also matches.
test.describe('Results panel auto-expand', () => {
  const strip = (page: Page) => page.getByTestId('results-summary-strip');
  const body = (page: Page) => page.locator('#results-panel');
  const filterCount = (page: Page) => page.getByTestId('results-panel-filter-count');
  const firstConceptPath = mockData.content[0].conceptPath;
  const exportRow = (page: Page, rowIndex: number) =>
    page.locator('tbody').locator('tr[id^="ExplorerTable-row-"]').nth(rowIndex);

  async function mockExplorer(page: Page, features: { name: string; value: string }[] = []) {
    await mockApiConfig(page, { features });
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
  }

  async function addCategoricalFilter(
    page: Page,
    rowIndex: number,
    detail: Record<string, unknown>,
  ) {
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${(detail as { dataset: string }).dataset}`,
      detail,
    );
    await page.locator(`#ExplorerTable-row-${rowIndex} button[title^=Filter]`).click();
    const option = await getOption(page);
    await option.click();
    await page.getByTestId('add-filter').click();
  }

  test('expands when the first filter is added', async ({ page }) => {
    // Given
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(body(page)).not.toBeVisible();

    // When
    await addCategoricalFilter(page, 0, detailResponseCat);

    // Then
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(body(page)).toBeVisible();
    await expect(page.getByTestId(`added-filter-${firstConceptPath}`)).toBeVisible();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
  });

  test('leaves an already-expanded panel alone when a second filter is added', async ({ page }) => {
    // Given
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await addCategoricalFilter(page, 0, detailResponseCat);
    await expect(body(page)).toBeVisible();

    // When
    await addCategoricalFilter(page, 2, detailResponseCat2);

    // Then - the panel did not collapse, and both filters are in it
    await expect(filterCount(page)).toHaveText(/^2 filters added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(body(page)).toBeVisible();
    // The rest of "nothing jarring" - that `panelOpen` is not notified a second time, so no
    // consumer of it re-runs and the body is never torn down - is asserted in
    // tests/unit/resultsSummaryPanel.test.ts. It cannot be asserted from here: a DOM check
    // for the body surviving passes even when auto-open collapses before it opens, because
    // Svelte flushes the two writes together and the node never leaves the document.
  });

  test('expands when a variable is added for analysis', async ({ page }) => {
    // Given
    await mockExplorer(page, [{ name: 'ALLOW_EXPORT_ENABLED', value: 'true' }]);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When
    await exportRow(page, 0).getByTitle('Add for Analysis (e)').click();

    // Then
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId(`added-export-${firstConceptPath}`)).toBeVisible();
  });

  test('expands on load for a filter tree restored from sessionStorage', async ({ page }) => {
    // Given a collapsed panel with a filter in it
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await addCategoricalFilter(page, 0, detailResponseCat);
    await strip(page).click();
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When - a reload reads the tree back out of sessionStorage with no UI interaction, and
    // resets panelOpen to its collapsed default
    await page.reload();
    await userIsLoggedIn(page);

    // Then
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId(`added-filter-${firstConceptPath}`)).toBeVisible();
  });

  test('expands on load for a genomic filter restored from sessionStorage', async ({ page }) => {
    // Given
    await mockExplorer(page);
    await seedGenomicFilter(page);

    // When
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then - genomic filters are a store of their own, so this only passes if the panel
    // watches that one as well as the filter tree
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
  });

  test('keeps a manual collapse across a child route of the Explore layout', async ({ page }) => {
    // Given
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await addCategoricalFilter(page, 0, detailResponseCat);
    await strip(page).click();
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When - a route the layout spans, so the panel is never destroyed
    await navigateInApp(page, '/explorer/distributions');
    await expect(page.getByRole('heading', { name: 'Variable Distributions' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to Explore' }).click();

    // Then
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(body(page)).not.toBeVisible();
  });

  test('keeps a manual collapse across leaving Explore and coming back', async ({ page }) => {
    // Given
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await addCategoricalFilter(page, 0, detailResponseCat);
    await strip(page).click();
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When - leaving the section destroys the panel, so coming back builds a new one. The
    // cohort it finds is the one the user already collapsed over, not news.
    await navigateInApp(page, '/help');
    await expect(page).toHaveURL(/\/help$/);
    await navigateInApp(page, '/explorer?search=somedata');

    // Then
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(body(page)).not.toBeVisible();
  });

  test('keeps a manual expansion across leaving Explore and coming back', async ({ page }) => {
    // Given an empty cohort, so nothing could re-open the panel on the user's behalf
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await strip(page).click();
    await expect(body(page)).toBeVisible();

    // When
    await navigateInApp(page, '/help');
    await expect(page).toHaveURL(/\/help$/);
    await navigateInApp(page, '/explorer?search=somedata');

    // Then
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(body(page)).toBeVisible();
  });

  test('keeps a manual collapse after a filter is enriched in place', async ({ page }) => {
    // Given a Continuous filter, which is the only kind whose searchResult arrives without a
    // `table`: AddFilter re-fetches concept details for Categorical only, so the enrich guard
    // in enrichFilterDetails passes and it patches `table` and `study` onto a filter that is
    // already in the tree - in place, with no write to filterTree for the panel to see.
    await mockExplorer(page);
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    const continuousRow = mockData.content[3];
    await page.locator('#ExplorerTable-row-3 button[title^=Filter]').click();
    await page.getByTestId('add-filter').click();
    await expect(page.getByTestId(`added-filter-${continuousRow.conceptPath}`)).toBeVisible();

    // The enrichment is fire-and-forget, so wait for the evidence it landed: its only other
    // effect is writing the patched tree straight to sessionStorage.
    await page.waitForFunction(() =>
      (sessionStorage.getItem('filterTree') ?? '').includes('"table":{'),
    );

    // When
    await strip(page).click();
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await navigateInApp(page, '/help');
    await expect(page).toHaveURL(/\/help$/);
    await navigateInApp(page, '/explorer?search=somedata');

    // Then - the enriched bytes are not the query, so the new panel must read this as the
    // same cohort the user collapsed over
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(body(page)).not.toBeVisible();
  });

  test('keeps a manual collapse when a variable is removed', async ({ page }) => {
    // Given a collapsed panel holding a filter and an added variable
    await mockExplorer(page, [{ name: 'ALLOW_EXPORT_ENABLED', value: 'true' }]);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await addCategoricalFilter(page, 0, detailResponseCat);
    await exportRow(page, 1).getByTitle('Add for Analysis (e)').click();
    const secondConceptPath = mockData.content[1].conceptPath;
    await expect(page.getByTestId(`added-export-${secondConceptPath}`)).toBeVisible();
    await strip(page).click();
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When - the one removal reachable without opening the body first
    await exportRow(page, 1).getByTitle('Remove from Analysis (e)').click();

    // Then - the cohort still holds the filter, so it is not empty, but it shrank, and taking
    // something away is not a reason to overrule a collapse
    await expect(exportRow(page, 1).getByTitle('Add for Analysis (e)')).toBeVisible();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(body(page)).not.toBeVisible();
  });

  test('stays open when the last filter is removed', async ({ page }) => {
    // Given
    await mockExplorer(page);
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await addCategoricalFilter(page, 0, detailResponseCat);
    const chip = page.getByTestId(`added-filter-${firstConceptPath}`);
    await expect(chip).toBeVisible();

    // When
    await chip.getByTitle('Remove Filter').click();

    // Then
    await expect(filterCount(page)).toHaveText('No filters added, add below');
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(body(page)).toBeVisible();
  });
});

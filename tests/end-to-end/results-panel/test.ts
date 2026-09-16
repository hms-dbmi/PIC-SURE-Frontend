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
import {
  addFilterButton,
  getOption,
  mockConceptDetailFromRows,
  navigateInApp,
  openNthResult,
  openNthResultFilter,
  seedGenomicFilter,
  userIsLoggedIn,
} from '../utils';

const countResultPath = '*/**/picsure/hpds/auth/v3/query/sync';
const openCountResultPath = '*/**/picsure/hpds/open/v3/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Results Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    // Filtering and Add for Analysis are on a result's own page, which loads the concept
    // before it renders. Specs that assert on particular detail fields register their own
    // route later and win.
    await mockConceptDetailFromRows(page);
  });
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
    await openNthResultFilter(page, 0);
    await page.locator('#options-container label:nth-child(1)').click();
    await addFilterButton(page).click();

    // Then
    await expect(page.getByTestId('results-panel-filter-count')).toHaveText('1 filter added');

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
      detailResponseCat2,
    );
    await openNthResultFilter(page, 2);
    await page.locator('#select-all').click();
    await addFilterButton(page).click();

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
    await openNthResultFilter(page, 0);
    await page.locator('#options-container label:nth-child(1)').click();
    await addFilterButton(page).click();

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
  test('Result panel names the page to add a filter from when there are none', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);
    await page.locator('#results-panel-toggle').click();
    await expect(page.locator('#results-panel')).toBeVisible();

    // Then
    await expect(page.getByTestId('no-filters-message')).toHaveText(
      // Genomic search is off in this describe's config, so Explore has one search mode.
      'No filters yet - add one from the phenotypes page below',
    );
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
    await expect(page.getByTestId('no-filters-message')).toHaveText(
      // Genomic search is off in this describe's config, so Explore has one search mode.
      'No filters yet - add one from the phenotypes page below',
    );
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
    await openNthResultFilter(page, 0);
    await page.locator('#options-container label:nth-child(1)').click();
    await addFilterButton(page).click();

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
    await openNthResultFilter(page, 0);
    await page.locator('#options-container label:nth-child(1)').click();
    await addFilterButton(page).click();
    const exportButton = page.locator('#export-data-button');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Add second filter to trigger delayed counts and disabled state
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
      detailResponseCat2,
    );
    await openNthResultFilter(page, 2);
    await page.locator('#select-all').click();
    await addFilterButton(page).click();

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
    // Per row rather than one fixed response for the dataset: this spec opens two different
    // results, and a dataset-wide mock would hand the second one the first one's concept, so
    // the export it added would carry the wrong concept path.
    await mockConceptDetailFromRows(page);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=age');
    await userIsLoggedIn(page);

    const expectedRowIds = mockData.content.map((row) => row.conceptPath);

    await openNthResultFilter(page, 0);
    const firstFilter = await getOption(page);
    await firstFilter.click();
    await addFilterButton(page).click();
    await expect(page.getByTestId(`added-filter-${expectedRowIds[0]}`)).toBeVisible();

    await openNthResult(page, 1);
    await page.getByTestId('variable-detail-export-toggle').click();
    await expect(page.getByTestId(`added-export-${expectedRowIds[1]}`)).toBeVisible();

    // When
    await page.getByTestId('clear-all-results-btn').click();
    await page.locator('#modal-component').getByRole('button', { name: 'Yes' }).click();

    // Then
    await expect(page.getByTestId('no-filters-message')).toHaveText(
      // Genomic search is off in this describe's config, so Explore has one search mode.
      'No filters yet - add one from the phenotypes page below',
    );
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
      await openNthResultFilter(page, 0);
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await openNthResultFilter(page, 2);
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await addFilterButton(page).click();

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
      await openNthResultFilter(page, 0);
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();

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
      await openNthResultFilter(page, 0);
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();
      await expect(page.locator('#result-count-number')).toHaveText('9,999');
      await expect(page.getByTestId('distributions-btn')).toBeEnabled();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat2.dataset}`,
        detailResponseCat2,
      );
      await openNthResultFilter(page, 2);
      const secondItem = await getOption(page);
      await secondItem.click();
      await addFilterButton(page).click();
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
      await openNthResultFilter(page, 0);
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();

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
      await openNthResultFilter(page, 0);
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();

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
      await openNthResultFilter(page, 0);
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();

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
      await openNthResultFilter(page, 0);
      await page.locator('#options-container label:nth-child(1)').click();
      const firstItem = await getOption(page);
      await firstItem.click();
      await addFilterButton(page).click();

      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat2,
      );
      await openNthResultFilter(page, 2);
      await page.locator('#options-container label:nth-child(1)').click();
      const secondItem = await getOption(page);
      await secondItem.click();
      await addFilterButton(page).click();

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
// zero-filter strings "No filters added, add below" and "No filters added" also match.
test.describe('Results panel auto-expand', () => {
  const strip = (page: Page) => page.getByTestId('results-summary-strip');
  const body = (page: Page) => page.locator('#results-panel');
  const filterCount = (page: Page) => page.getByTestId('results-panel-filter-count');
  const firstConceptPath = mockData.content[0].conceptPath;

  async function mockExplorer(page: Page, features: { name: string; value: string }[] = []) {
    await mockApiConfig(page, features.length > 0 ? { features } : undefined);
    await mockConceptDetailFromRows(page);
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
    await openNthResultFilter(page, rowIndex);
    const option = await getOption(page);
    await option.click();
    await addFilterButton(page).click();
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

    // When - Add for Analysis lives on the variable's own page now
    await openNthResult(page, 0);
    await page.getByTestId('variable-detail-export-toggle').click();

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
    // Row 4, not row 3: concept detail is keyed on the dataset, and the override registered
    // just above answers for every concept in test_data_set - which rows 0-3 all share - so
    // opening row 3 serves a Categorical detail and loses the Continuous premise. Row 4 is
    // Continuous in a dataset of its own.
    const continuousRow = mockData.content[4];
    await openNthResultFilter(page, 4);
    await addFilterButton(page).click();
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
    // Row 5, not row 1: addCategoricalFilter's detail override is keyed on test_data_set,
    // which rows 0-3 share, so opening row 1 would serve row 0's detail and export the
    // variable that is already filtered - leaving nothing for the removal to shrink.
    await openNthResult(page, 5);
    const exportToggle = page.getByTestId('variable-detail-export-toggle');
    await exportToggle.click();
    const secondConceptPath = mockData.content[5].conceptPath;
    await expect(page.getByTestId(`added-export-${secondConceptPath}`)).toBeVisible();
    await strip(page).click();
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When - the removal, still on the variable's own page, so the body stays untouched. The
    // toggle is one button reading either way, so this is the same control that added it.
    await exportToggle.click();

    // Then - the cohort still holds the filter, so it is not empty, but it shrank, and taking
    // something away is not a reason to overrule a collapse
    await expect(exportToggle).toHaveText(/Add for Analysis/);
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

    // Then the strip is back to zero, without the "add below" pointer it only carries while
    // the body is hidden
    await expect(filterCount(page)).toHaveText('No filters added');
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(body(page)).toBeVisible();
  });
});

// The empty state is built from the search-mode registry, so it names only the modes the page
// in front of the user actually has. Asserted with toHaveText, which is exact: an unanchored
// match on "phenotypes" would pass for every one of these cases.
test.describe('Results panel empty state', () => {
  const EXPLORE_BOTH_MODES = 'No filters yet - add one from the phenotypes or genotypes page below';
  const PHENOTYPES_ONLY = 'No filters yet - add one from the phenotypes page below';

  const emptyState = (page: Page) => page.getByTestId('no-filters-message');
  const genomicOff = [
    { name: 'ENABLE_GENE_QUERY', value: 'false' },
    { name: 'ENABLE_SNP_QUERY', value: 'false' },
  ];

  async function mockResults(page: Page) {
    await mockConceptDetailFromRows(page);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
  }

  // The count endpoint and the shape it answers with are one decision, not two: Discover asks
  // the open-access endpoint for a CROSS_COUNT and gets the per-consent map back, which is
  // what providers.ts parses, while Explore's authenticated COUNT is the bare scalar. One
  // helper taking the path and the fixture as separate arguments let a call site hand either
  // endpoint either shape, and the parser is lenient enough - map gets `_studies_consents_`
  // pulled out of it, anything else comes back raw - that a swapped pair leaves the suite
  // green on the wrong data. So the pairing lives here, once per section, and a call site has
  // no pair left to get wrong.
  async function mockExploreSearch(page: Page) {
    await mockResults(page);
    await mockApiSuccess(page, countResultPath, '9999');
  }

  async function mockDiscoverSearch(page: Page) {
    await mockResults(page);
    await mockApiSuccess(page, openCountResultPath, { '\\_studies_consents\\': 9999 });
  }

  test.describe('on Explore', () => {
    test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

    test('names both pages when genomic search gives Explore a Genotypes tab', async ({ page }) => {
      // Given
      await mockApiConfig(page, { features: [{ name: 'ENABLE_GENE_QUERY', value: 'true' }] });
      await mockExploreSearch(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // When
      await page.getByTestId('results-summary-strip').click();

      // Then
      await expect(emptyState(page)).toHaveText(EXPLORE_BOTH_MODES);
    });

    // A real deployment shape: both genomic flags off leaves Explore with a single mode and
    // no Genotypes tab to send anyone to.
    test('names the phenotypes page alone when genomic search is off', async ({ page }) => {
      // Given
      await mockApiConfig(page, { features: genomicOff });
      await mockExploreSearch(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // When
      await page.getByTestId('results-summary-strip').click();

      // Then
      await expect(emptyState(page)).toHaveText(PHENOTYPES_ONLY);
    });

    // The strip's "add below" points at a body the reader cannot see. Once the body is open it
    // says the same thing and names the pages, so the empty state reads once, not twice.
    test('moves the pointer from the strip into the body on expanding', async ({ page }) => {
      // Given
      await mockApiConfig(page, { features: genomicOff });
      await mockExploreSearch(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      const strip = page.getByTestId('results-summary-strip');
      const summary = page.getByTestId('results-panel-filter-count');

      // Then collapsed, the strip is the only thing pointing anywhere
      await expect(strip).toHaveAttribute('aria-expanded', 'false');
      await expect(summary).toHaveText('No filters added, add below');
      await expect(emptyState(page)).toHaveCount(0);

      // And expanded, the strip is the bare count and the body carries the pointer
      await strip.click();
      await expect(strip).toHaveAttribute('aria-expanded', 'true');
      await expect(summary).toHaveText('No filters added');
      await expect(emptyState(page)).toHaveText(PHENOTYPES_ONLY);
    });

    test('drops the text as soon as the first filter is added', async ({ page }) => {
      // Given an open, empty panel
      await mockApiConfig(page, { features: [{ name: 'ENABLE_GENE_QUERY', value: 'true' }] });
      await mockExploreSearch(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await page.getByTestId('results-summary-strip').click();
      await expect(emptyState(page)).toHaveText(EXPLORE_BOTH_MODES);

      // When a filter is added
      await mockApiSuccess(
        page,
        `${conceptsDetailPath}/${detailResponseCat.dataset}`,
        detailResponseCat,
      );
      await openNthResultFilter(page, 0);
      const option = await getOption(page);
      await option.click();
      await addFilterButton(page).click();

      // Then
      await expect(
        page.getByTestId(`added-filter-${mockData.content[0].conceptPath}`),
      ).toBeVisible();
      await expect(emptyState(page)).toHaveCount(0);
    });
  });

  // Genomic search on, to prove Discover's single mode is the isDiscover half of the rule and
  // not just an unset flag.
  test.describe('on Discover', () => {
    test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

    test('names the phenotypes page alone, having no Genotypes tab', async ({ page }) => {
      // Given
      await mockApiConfig(page, {
        features: [
          { name: 'OPEN', value: 'true' },
          { name: 'DISCOVER', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
          { name: 'ENABLE_GENE_QUERY', value: 'true' },
          { name: 'ENABLE_SNP_QUERY', value: 'true' },
        ],
      });
      await mockDiscoverSearch(page);
      await page.goto('/discover?search=somedata');
      // The strip is server-rendered for an unauthenticated visitor, so wait for the
      // client-side count before clicking it: a click that lands before hydration is
      // swallowed and the panel never opens. The Explore cases get this from userIsLoggedIn.
      await expect(page.getByTestId('results-panel-count')).toContainText('9,999');

      // When
      await page.getByTestId('results-summary-strip').click();

      // Then
      await expect(emptyState(page)).toHaveText(PHENOTYPES_ONLY);
    });
  });
});

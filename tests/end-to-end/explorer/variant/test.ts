import { expect, type Route, type BrowserContext, type Page } from '@playwright/test';
import { mockApiSuccess, test, mockApiConfig } from '../../custom-context';
import {
  geneValues,
  variantDataAggregate,
  variantDataFull,
  conceptsDetailPath,
  detailResponseCat,
  facetResultPath,
  facetsResponse,
  searchResults as mockData,
  searchResultPath,
} from '../../mock-data';
import { getOption, clickNthFilterIcon, userIsLoggedIn } from '../../utils';

const SyncQueryV3 = '*/**/picsure/hpds/auth/v3/query/sync';

interface Results {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: { pass: boolean; data: any };
}

const successResults: Results = {
  VARIANT_COUNT_FOR_QUERY: { pass: true, data: { count: 5, message: 'Query ran successfully' } },
  AGGREGATE_VCF_EXCERPT: { pass: true, data: variantDataAggregate },
  VCF_EXCERPT: { pass: true, data: variantDataFull },
  COUNT: { pass: true, data: '999' },
};

function mockSyncAPI(context: BrowserContext | Page, resultMap: Results) {
  return context.route(SyncQueryV3, (route: Route) => {
    const request = route.request().postDataJSON();
    const result = resultMap[request.query.expectedResultType];
    if (result && result.pass) {
      return route.fulfill({ json: result.data });
    } else if (result) {
      return route.abort(result.data);
    } else {
      return route.abort('request has undefined query expectedResultType');
    }
  });
}

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('variant explorer', () => {
  test.describe('Genetic filter applied', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiConfig(page, {
        features: [
          { name: 'ENABLE_GENE_QUERY', value: 'true' },
          { name: 'ENABLE_SNP_QUERY', value: 'true' },
          { name: 'VARIANT_EXPLORER', value: 'true' },
        ],
      });
      await mockApiSuccess(page, SyncQueryV3, '9999');
      await mockApiSuccess(page, '*/**/picsure/dictionary/facets', facetsResponse);
      // Add genomic filter steps
      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await mockSyncAPI(page, successResults);
      await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
      // open the sidebar to reduce locator time on result panel items during testing
      await page.locator('#results-panel-toggle').click();
      await page.getByTestId('genomic-filter-btn').click();
      await expect(page.getByTestId('gene-variant-option')).toBeVisible();
      await page.getByTestId('gene-variant-option').click();
      await page.locator('#options-container').getByLabel(geneValues.results[0]).click();
      await page.getByTestId('add-filter-btn').click();
      await expect(page).toHaveURL('/explorer');
    });
    test('Adds variant explorer button to gene results', async ({ page }) => {
      // Then
      await expect(page.getByTestId('variant-explorer-btn')).toBeEnabled();
    });
    test('Displays variant count', async ({ page }) => {
      // When
      await page.getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('variant-count')).toContainText('5');
    });
    test('Loads variant data table', async ({ page }) => {
      // When
      await page.getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('variant-explorer-table')).toBeVisible();
    });
    test('Can download variant data', async ({ page }) => {
      // Given
      await page.getByTestId('variant-explorer-btn').click();

      // When
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('variant-download-btn').click(),
      ]);

      // Then
      expect(download.suggestedFilename()).toBe('variantData.tsv');
    });
    test("Displays count, even if it's 0", async ({ page }) => {
      // When
      await mockSyncAPI(page, {
        ...successResults,
        VARIANT_COUNT_FOR_QUERY: {
          pass: true,
          data: { count: 0, message: 'Query ran successfully' },
        },
      });
      await page.getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('variant-count')).toContainText('0');
    });
    test('Error occurs during variant count retrieval', async ({ page }) => {
      // Given
      await mockSyncAPI(page, {
        ...successResults,
        VARIANT_COUNT_FOR_QUERY: { pass: false, data: 'failed' },
      });

      // When
      await page.getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page.getByTestId('error-alert')).toBeVisible();
      await expect(page.getByTestId('error-alert')).toContainText('Error');
    });
    test('Error occurs during variant retrieval', async ({ page }) => {
      // Given
      await mockSyncAPI(page, {
        ...successResults,
        AGGREGATE_VCF_EXCERPT: { pass: false, data: 'failed' },
      });

      // When
      await page.getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('error-alert')).toBeVisible();
      await expect(page.getByTestId('error-alert')).toContainText('Error');
    });
  });
  test.describe('Variant Explorer settings', () => {
    async function setupVariantExplorer(
      page: Page,
      settings: { name: string; value: string }[] = [],
    ) {
      await mockApiConfig(page, {
        features: [
          { name: 'ENABLE_GENE_QUERY', value: 'true' },
          { name: 'ENABLE_SNP_QUERY', value: 'true' },
          { name: 'VARIANT_EXPLORER', value: 'true' },
        ],
        settings,
      });
      await mockApiSuccess(page, SyncQueryV3, '9999');
      await mockApiSuccess(page, '*/**/picsure/dictionary/facets', facetsResponse);
      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await mockSyncAPI(page, successResults);
      await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
      await page.locator('#results-panel-toggle').click();
      await page.getByTestId('genomic-filter-btn').click();
      await expect(page.getByTestId('gene-variant-option')).toBeVisible();
      await page.getByTestId('gene-variant-option').click();
      await page.locator('#options-container').getByLabel(geneValues.results[0]).click();
      await page.getByTestId('add-filter-btn').click();
      await expect(page).toHaveURL('/explorer');
      await page.getByTestId('variant-explorer-btn').click();
      await expect(page).toHaveURL('/explorer/variant');
    }

    test('VARIANT_EXPLORER_MAX_COUNT below the result count shows a warning instead of the table', async ({
      page,
    }) => {
      // Given/When - the mocked count (5) exceeds this max count of 3
      await setupVariantExplorer(page, [{ name: 'VARIANT_EXPLORER_MAX_COUNT', value: '3' }]);

      // Then
      await expect(page.getByTestId('error-alert')).toContainText('Too many variants!');
      await expect(page.getByTestId('error-alert')).toContainText('cannot display more than');
      await expect(page.getByTestId('variant-explorer-table')).not.toBeVisible();
    });

    test('VARIANT_EXPLORER_TYPE=full requests full variant data and shows the aggregate-toggle checkbox', async ({
      page,
    }) => {
      // Given/When
      await setupVariantExplorer(page, [{ name: 'VARIANT_EXPLORER_TYPE', value: 'full' }]);

      // Then
      await expect(page.getByTestId('variant-explorer-table')).toBeVisible();
      await expect(page.getByText('Aggregate data')).toBeVisible();
    });

    test('VARIANT_EXPLORER_TYPE=aggregate (default) hides the aggregate-toggle checkbox', async ({
      page,
    }) => {
      // Given/When
      await setupVariantExplorer(page);

      // Then
      await expect(page.getByTestId('variant-explorer-table')).toBeVisible();
      await expect(page.getByText('Aggregate data')).not.toBeVisible();
    });

    test('VARIANT_EXPLORER_EXCLUDE_COLUMNS removes the listed columns from the result table', async ({
      page,
    }) => {
      // Given/When
      await setupVariantExplorer(page, [
        { name: 'VARIANT_EXPLORER_EXCLUDE_COLUMNS', value: JSON.stringify(['REF', 'ALT']) },
      ]);

      // Then
      const table = page.getByTestId('variant-explorer-table');
      await expect(table).toBeVisible();
      await expect(table.locator('thead').getByText('CHROM', { exact: true })).toBeVisible();
      await expect(table.locator('thead').getByText('REF', { exact: true })).not.toBeVisible();
      await expect(table.locator('thead').getByText('ALT', { exact: true })).not.toBeVisible();
    });
  });
  test('Display notice when no genomic query exists', async ({ page }) => {
    // Given
    // This test sits outside the 'Genetic filter applied' describe, so it has no
    // api/config mock of its own; without one requests fall through to the real,
    // unmocked /api/config endpoint.
    await mockApiConfig(page);
    await mockSyncAPI(page, successResults);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // has one pheno filter
    await clickNthFilterIcon(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();
    await expect(page.locator('#results-panel')).toBeVisible();

    // When
    await page.goto('/explorer/variant');

    // Then
    await expect(page).toHaveURL('/explorer');
    const toast = await page.getByTestId('toast-root').allInnerTexts();
    expect(toast.find((msg) => msg.includes('No query provided'))).toBeTruthy();
  });
});

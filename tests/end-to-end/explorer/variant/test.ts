import { expect, type Page } from '@playwright/test';
import { mockApiSuccess, test, mockApiConfig, mockQuerySync } from '../../custom-context';
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

const SyncQueryPath = '*/**/picsure/hpds/auth/query/sync';

const successResults = {
  VARIANT_COUNT_FOR_QUERY: { count: 5, message: 'Query ran successfully' },
  AGGREGATE_VCF_EXCERPT: variantDataAggregate,
  VCF_EXCERPT: variantDataFull,
  COUNT: '999',
};

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
      await mockApiSuccess(page, SyncQueryPath, '9999');
      await mockApiSuccess(page, '*/**/picsure/dictionary/facets', facetsResponse);
      // Add genomic filter steps
      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await mockQuerySync(page, successResults);
      await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
      // open the sidebar to reduce locator time on result panel items during testing
      await page.locator('#results-panel-toggle').click();
      await page.getByTestId('explorer-genomic-filter-open').click();
      await expect(page.getByTestId('genomic-type-gene')).toBeVisible();
      await page.getByTestId('genomic-type-gene').click();
      await page
        .getByTestId('ui-options-selection-list-available')
        .getByLabel(geneValues.results[0])
        .click();
      await page.getByTestId('genomic-filter-add').click();
      await expect(page).toHaveURL('/explorer');
    });
    test('Adds variant explorer button to gene results', async ({ page }) => {
      // Then
      await expect(page.getByTestId('results-variant-explorer-open')).toBeEnabled();
    });
    test('Displays variant count', async ({ page }) => {
      // When
      await page.getByTestId('results-variant-explorer-open').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('explorer-variant-count')).toContainText('5');
    });
    test('Loads variant data table', async ({ page }) => {
      // When
      await page.getByTestId('results-variant-explorer-open').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('explorer-variant-table')).toBeVisible();
    });
    test('Can download variant data', async ({ page }) => {
      // Given
      await page.getByTestId('results-variant-explorer-open').click();

      // When
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('explorer-variant-download').click(),
      ]);

      // Then
      expect(download.suggestedFilename()).toBe('variantData.tsv');
    });
    test("Displays count, even if it's 0", async ({ page }) => {
      // When
      await mockQuerySync(page, {
        ...successResults,
        VARIANT_COUNT_FOR_QUERY: { count: 0, message: 'Query ran successfully' },
      });
      await page.getByTestId('results-variant-explorer-open').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('explorer-variant-count')).toContainText('0');
    });
    test('Error occurs during variant count retrieval', async ({ page }) => {
      // Given
      await mockQuerySync(page, {
        ...successResults,
        VARIANT_COUNT_FOR_QUERY: new Error('failed'),
      });

      // When
      await page.getByTestId('results-variant-explorer-open').click();

      // Then
      await expect(page.getByTestId('ui-error-alert')).toBeVisible();
      await expect(page.getByTestId('ui-error-alert')).toContainText('Error');
    });
    test('Error occurs during variant retrieval', async ({ page }) => {
      // Given
      await mockQuerySync(page, {
        ...successResults,
        AGGREGATE_VCF_EXCERPT: new Error('failed'),
      });

      // When
      await page.getByTestId('results-variant-explorer-open').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('ui-error-alert')).toBeVisible();
      await expect(page.getByTestId('ui-error-alert')).toContainText('Error');
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
      await mockApiSuccess(page, SyncQueryPath, '9999');
      await mockApiSuccess(page, '*/**/picsure/dictionary/facets', facetsResponse);
      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await mockQuerySync(page, successResults);
      await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
      await page.locator('#results-panel-toggle').click();
      await page.getByTestId('explorer-genomic-filter-open').click();
      await expect(page.getByTestId('genomic-type-gene')).toBeVisible();
      await page.getByTestId('genomic-type-gene').click();
      await page
        .getByTestId('ui-options-selection-list-available')
        .getByLabel(geneValues.results[0])
        .click();
      await page.getByTestId('genomic-filter-add').click();
      await expect(page).toHaveURL('/explorer');
      await page.getByTestId('results-variant-explorer-open').click();
      await expect(page).toHaveURL('/explorer/variant');
    }

    test('VARIANT_EXPLORER_MAX_COUNT below the result count shows a warning instead of the table', async ({
      page,
    }) => {
      // Given/When - the mocked count (5) exceeds this max count of 3
      await setupVariantExplorer(page, [{ name: 'VARIANT_EXPLORER_MAX_COUNT', value: '3' }]);

      // Then
      await expect(page.getByTestId('ui-error-alert')).toContainText('Too many variants!');
      await expect(page.getByTestId('ui-error-alert')).toContainText('cannot display more than');
      await expect(page.getByTestId('explorer-variant-table')).not.toBeVisible();
    });

    test('VARIANT_EXPLORER_TYPE=full requests full variant data and shows the aggregate-toggle checkbox', async ({
      page,
    }) => {
      // Given/When
      await setupVariantExplorer(page, [{ name: 'VARIANT_EXPLORER_TYPE', value: 'full' }]);

      // Then
      await expect(page.getByTestId('explorer-variant-table')).toBeVisible();
      await expect(page.getByText('Aggregate data')).toBeVisible();
    });

    test('VARIANT_EXPLORER_TYPE=aggregate (default) hides the aggregate-toggle checkbox', async ({
      page,
    }) => {
      // Given/When
      await setupVariantExplorer(page);

      // Then
      await expect(page.getByTestId('explorer-variant-table')).toBeVisible();
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
      const table = page.getByTestId('explorer-variant-table');
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
    await mockQuerySync(page, successResults);
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
    const addFilterButton = page.getByTestId('filter-add');
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

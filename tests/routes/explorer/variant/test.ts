import { expect, type Route, type BrowserContext, type Page } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { geneValues, infoColumns, variantDataAggregate, variantDataFull } from '../../../mock-data';

const HPDS = process.env.VITE_RESOURCE_HPDS;

interface Results {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: { pass: boolean; data: any };
}

const successResults: Results = {
  VARIANT_COUNT_FOR_QUERY: { pass: true, data: { count: 5, message: 'Query ran successfully' } },
  AGGREGATE_VCF_EXCERPT: { pass: true, data: variantDataAggregate },
  VCF_EXCERPT: { pass: true, data: variantDataFull },
  INFO_COLUMN_LISTING: { pass: true, data: infoColumns },
  COUNT: { pass: true, data: '999' },
};

function mockSyncAPI(context: BrowserContext | Page, resultMap: Results) {
  return context.route('*/**/picsure/query/sync', (route: Route) => {
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

test.describe('variant explorer', { tag: ['@feature', '@variantExplorer'] }, () => {
  test.describe('Genetic filter applied', () => {
    test.beforeEach(async ({ page }) => {
      // Add genomic filter steps
      await mockSyncAPI(page, successResults);
      await mockApiSuccess(page, `*/**/picsure/search/${HPDS}/values/*`, geneValues);
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('gene-variant-option').click();
      await page.getByTestId('next-btn').click();
      await page.locator('#options-container').getByLabel(geneValues.results[0]).click();
      await page.getByTestId('apply-filter-btn').click();
      await expect(page).toHaveURL('/explorer');
    });
    test('Adds variant explorer button to results', async ({ page }) => {
      // Then
      await expect(
        page.locator('#results-panel').getByTestId('variant-explorer-btn'),
      ).toBeEnabled();
    });
    test('Displays variant count', async ({ page }) => {
      // When
      await page.locator('#results-panel').getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('variant-count')).toContainText('5');
    });
    test('Loads variant data table', async ({ page }) => {
      // When
      await page.locator('#results-panel').getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.getByTestId('variant-explorer-table')).toBeVisible();
    });
    test('Can download variant data', async ({ page }) => {
      // Given
      await page.locator('#results-panel').getByTestId('variant-explorer-btn').click();

      // When
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('variant-download-btn').click(),
      ]);

      // Then
      await expect(download.suggestedFilename()).toBe('variantData.tsv');
    });
    test('Error occurs during variant count retrieval', async ({ page }) => {
      // Given
      await mockSyncAPI(page, {
        ...successResults,
        VARIANT_COUNT_FOR_QUERY: { pass: false, data: 'failed' },
      });

      // When
      await page.locator('#results-panel').getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
    test('Error occurs during variant retrieval', async ({ page }) => {
      // Given
      await mockSyncAPI(page, {
        ...successResults,
        AGGREGATE_VCF_EXCERPT: { pass: false, data: 'failed' },
      });

      // When
      await page.locator('#results-panel').getByTestId('variant-explorer-btn').click();

      // Then
      await expect(page).toHaveURL('/explorer/variant');
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
  });
  test('Display notice when no query exists', async ({ page }) => {
    // Given
    mockSyncAPI(page, successResults);
    await page.goto('/explorer/variant');

    // Then
    await expect(page).toHaveURL('/explorer');
    await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
  });
});

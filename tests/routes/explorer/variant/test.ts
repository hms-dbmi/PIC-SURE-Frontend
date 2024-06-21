import { expect, type Route, type BrowserContext, type Page } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { geneValues, infoColumns, variantDataAggregate, variantDataFull } from '../../../mock-data';

const HPDS = process.env.VITE_RESOURCE_HPDS;

function mockSyncAPISuccess(context: BrowserContext | Page) {
  return context.route('*/**/picsure/query/sync', (route: Route) => {
    const request = route.request().postDataJSON();
    switch (request.query.expectedResultType) {
      case 'VARIANT_COUNT_FOR_QUERY':
        return route.fulfill({ json: { count: 5, message: 'Query ran successfully' } });
      case 'AGGREGATE_VCF_EXCERPT':
        return route.fulfill({ json: variantDataAggregate });
      case 'VCF_EXCERPT':
        return route.fulfill({ json: variantDataFull });
      case 'INFO_COLUMN_LISTING':
        return route.fulfill({ json: infoColumns });
      case 'COUNT':
        return route.fulfill({ json: '999' });
      default:
        return route.abort('request has undefined query expectedResultType');
    }
  });
}

test.describe('variant explorer', { tag: ['@feature', '@variantExplorer'] }, () => {
  test.describe('Genetic filter applied', () => {
    test.beforeEach(async ({ page }) => {
      // Add genomic filter steps
      await mockSyncAPISuccess(page);
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
  });
});

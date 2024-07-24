import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { geneValues } from '../../../mock-data';
import { branding } from '../../../../src/lib/configuration';

const HPDS = process.env.VITE_RESOURCE_HPDS;

test.describe('genomic filter', () => {
  test('Clicking the Genomic filter button navigates to genomic filter page', async ({ page }) => {
    // Given
    await page.goto('/explorer');

    // When
    await page.getByTestId('genomic-filter-btn').click();

    // Then
    await expect(page).toHaveURL('/explorer/genome-filter');
    await expect(
      page.getByRole('heading').getByText('Genomic Filtering', { exact: true }),
    ).toBeTruthy();
  });
  test.describe('Gene filter', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/search/${HPDS}/values/*`, geneValues);
    });
    test('Selecting Gene option advances to gene filter options', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');

      // When
      await page.getByTestId('gene-variant-option').click();

      // Then
      await expect(page.locator('#gene-search')).toBeVisible();
    });
    test.describe('Gene selection', () => {
      test('Loads list of genes ', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        // Then
        await expect(page.getByLabel(geneValues.results[0])).toBeVisible();
      });
      test('Can search genes', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        await expect(page.getByLabel(geneValues.results[0])).toBeVisible();

        // When
        const mockSearchResults = ['G123Z', 'G234Z'];
        await mockApiSuccess(page, `*/**/picsure/search/${HPDS}/values/*`, {
          ...geneValues,
          results: mockSearchResults,
        });
        await page.getByPlaceholder('Search...').fill('Z');

        // Then
        await expect(page.getByLabel(geneValues.results[0])).not.toBeVisible();
        await expect(page.getByLabel(mockSearchResults[1])).toBeVisible();
      });
      test('Selected genes move to selected box', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const optionsContainer = page.locator('#options-container');
        const selectedContainer = page.locator('#selected-options-container');

        // When
        await optionsContainer.getByLabel(geneValues.results[0]).click();

        // Then
        await expect(optionsContainer.getByLabel(geneValues.results[0])).not.toBeVisible();
        await expect(selectedContainer.getByLabel(geneValues.results[0])).toBeVisible();
      });
      test('Can clear selected genes', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const optionsContainer = page.locator('#options-container');
        const selectedContainer = page.locator('#selected-options-container');

        // When
        await optionsContainer.getByLabel(geneValues.results[0]).click();
        await page.getByTestId('clear-selected-genes-btn').click();

        // Then
        await expect(selectedContainer.getByLabel(geneValues.results[0])).not.toBeVisible();
        await expect(optionsContainer.getByLabel(geneValues.results[0])).toBeVisible();
      });
    });
    test.describe('Frequency selection', () => {
      test('Frequency Help', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        await expect(page.getByTestId('freq-help-popup-content')).not.toBeVisible();

        // When
        await page.getByTestId('freq-help-popup').click();

        // Then
        await expect(page.getByTestId('freq-help-popup-content')).toContainText(
          branding.help.popups.genomicFilter.frequency,
        );
      });
    });
    test.describe('Consequnce selection', () => {
      test('Consequnce Help', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        await expect(page.getByTestId('cons-help-popup-content')).not.toBeVisible();

        // When
        await page.getByTestId('cons-help-popup').click();

        // Then
        await expect(page.getByTestId('cons-help-popup-content')).toContainText(
          branding.help.popups.genomicFilter.consequence,
        );
      });
      test('Selecting parent node selects all children nodes', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const consPanel = page.getByTestId('select-calculated-consequence');
        const parent = consPanel
          .getByRole('treeitem', { name: 'High Severity' })
          .getByRole('checkbox');
        const child = consPanel
          .getByRole('treeitem', { name: 'splice_acceptor_variant' })
          .getByRole('checkbox');

        // When
        await parent.click();

        // Then
        await expect(child).toBeChecked();
      });
      test('Can select child nodes individually', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const consPanel = page.getByTestId('select-calculated-consequence');
        const parentNode = consPanel.getByRole('treeitem', { name: 'High Severity' });
        const child = consPanel.getByRole('treeitem', { name: 'stop_lost' }).getByRole('checkbox');
        const sibling = consPanel
          .getByRole('treeitem', { name: 'splice_acceptor_variant' })
          .getByRole('checkbox');

        // When
        await parentNode.click();
        await child.click();

        // Then
        await expect(child).toBeChecked();
        await expect(sibling).not.toBeChecked();
      });
    });
    test.describe('Summary panel', () => {
      test('Displays selected genes', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const geneContainer = page.locator('#options-container');
        const geneSummary = page
          .getByTestId('summary-of-selected-filters')
          .locator('#selected-variant');

        // When
        await geneContainer.getByLabel(geneValues.results[0]).click();
        await geneContainer.getByLabel(geneValues.results[1]).click();

        // Then
        await expect(geneSummary).toContainText(geneValues.results[0]);
        await expect(geneSummary).toContainText(geneValues.results[1]);
      });
      test('Displays selected frequencies', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const freqContainer = page.getByTestId('select-variant-frequency');
        const freqSummary = page
          .getByTestId('summary-of-selected-filters')
          .locator('#selected-frequency');

        // When
        await freqContainer.getByLabel('Rare').click();
        await freqContainer.getByLabel('Common').click();

        // Then
        await expect(freqSummary).toContainText('Rare');
        await expect(freqSummary).toContainText('Common');
      });
      test('Displays selected consequences', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        const consContainer = page.getByTestId('select-calculated-consequence');
        const consSummary = page
          .getByTestId('summary-of-selected-filters')
          .locator('#selected-consequence');
        const parent = consContainer
          .getByRole('treeitem', { name: 'High Severity' })
          .getByRole('checkbox');

        // When
        await parent.click();

        // Then
        await expect(consSummary).not.toContainText('High Severity');
        await expect(consSummary).toContainText('stop_lost');
      });
      test('Clear button clears all selected values', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();

        await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();
        await page
          .getByTestId('select-calculated-consequence')
          .getByRole('treeitem', { name: 'High Severity' })
          .getByRole('checkbox')
          .click();
        await page
          .getByTestId('search-for-gene-with-variant')
          .getByLabel(geneValues.results[0])
          .click();

        const summaryPanel = page.getByTestId('summary-of-selected-filters');

        // When
        await page.getByTestId('clear-gene-filters-btn').click();

        // Then
        await expect(summaryPanel.locator('#selected-consequence')).not.toContainText('stop_lost');
        await expect(summaryPanel.locator('#selected-frequency')).not.toContainText('Rare');
        await expect(summaryPanel.locator('#selected-variant')).not.toContainText(
          geneValues.results[0],
        );
      });
    });
    test('Apply Filters button enables once a selection is made', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('gene-variant-option').click();

      await expect(page.getByTestId('add-filter-btn')).not.toBeEnabled();

      // When
      await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();

      // Then
      await expect(page.getByTestId('add-filter-btn')).toBeEnabled();
    });
    test('Apply Filter adds to sidepanel', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('gene-variant-option').click();

      await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();

      // When
      await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
      await page.getByTestId('add-filter-btn').click();

      // Then
      await expect(page.getByTestId('added-filter-Genomic Filter')).toBeVisible();
    });
    test('Clicking edit filter button in results panel returns to genomic filter with correct values', async ({
      page,
    }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('gene-variant-option').click();
      await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();
      await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
      await page.getByTestId('add-filter-btn').click();

      // When
      await page.waitForURL('**/explorer');
      await page
        .getByTestId('added-filter-Genomic Filter')
        .getByRole('button', { name: 'Edit Filter' })
        .click();

      // Then
      await expect(page.getByTestId('select-variant-frequency').getByLabel('Rare')).toBeChecked();
    });
  });
  test.describe('SNP filter', () => {
    const validSnp = 'chr17,35269878,GT,A';
    const invalidSnp = 'chr17, 35269878,,A';
    const snpError =
      'Please check that value matches: chromosome (chr#), position, reference allele, variant allele.';
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/search/${HPDS}/values/*`, geneValues);
    });
    test('Selecting SNP option advances snp filter options', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');

      // When
      await page.getByTestId('snp-option').click();

      // Then
      await expect(page.locator('#snp-search')).toBeVisible();
    });
    test('Search box enforces valid snp format', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();

      // When
      await page.getByTestId('snp-search-box').fill(invalidSnp);
      await page.getByTestId('snp-search-btn').click();

      // Then
      const message = await page
        .getByTestId('snp-search-box')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(message).toContain(snpError);
    });
    test('Search request returns 0, indicating no SNP was found', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();

      // When
      await mockApiSuccess(page, '*/**/picsure/query/sync', 0);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();

      // Then
      await expect(page.locator('.alert-message')).toBeVisible();
    });
    test('Search returns > 0, indicating SNP was found', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();

      // When
      await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();

      // Then
      await expect(page.getByTestId('snp-constraint')).toBeVisible();
    });
    test('Apply Filters button enables once genotype interest selection is made', async ({
      page,
    }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();

      await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();

      // When
      await page.getByTestId('snp-constraint').selectOption({ label: 'Heterozygous' });
      await page.getByTestId('snp-save-btn').click();

      // Then
      await expect(page.getByTestId('add-filter-btn')).toBeEnabled();
    });
    test('Apply Filter adds to sidepanel', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();

      await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();

      await page.getByTestId('snp-constraint').selectOption({ label: 'Heterozygous' });
      await page.getByTestId('snp-save-btn').click();

      // When
      await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
      await page.getByTestId('add-filter-btn').click();

      // Then
      await expect(page.getByTestId('added-filter-Variant Filter')).toBeVisible();
    });
    test('Clicking edit filter button in results panel returns to snp filter with correct values', async ({
      page,
    }) => {
      const snpConstraint = 'Heterozygous';
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();
      await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();
      await page.getByTestId('snp-constraint').selectOption({ label: snpConstraint });
      await page.getByTestId('snp-save-btn').click();
      await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
      await page.getByTestId('add-filter-btn').click();

      // When
      await page.waitForURL('**/explorer');
      await page
        .getByTestId('added-filter-Variant Filter')
        .getByRole('button', { name: 'Edit Filter' })
        .click();

      // Then
      await expect(
        page.getByTestId('summary-of-selected-filters').getByText(validSnp),
      ).toBeVisible();
      await expect(
        page.getByTestId('summary-of-selected-filters').getByText(snpConstraint),
      ).toBeVisible();
    });
  });
});

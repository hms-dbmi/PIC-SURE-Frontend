import { expect } from '@playwright/test';
import { resources } from '../../../../src/lib/configuration';
import { test, mockApiSuccess } from '../../../custom-context';
import { infoColumns, infoColumnDescriptions, geneValues } from '../../../mock-data';

test.describe('genomic filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, '*/**//picsure/query/sync', infoColumns);
  });
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
  test('Displays a stepper', async ({ page }) => {
    // Given
    await page.goto('/explorer/genome-filter');

    // Then
    await expect(page.locator('.stepper')).toBeVisible();
  });
  test.describe('Gene filter', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/search/${resources.hpds}/values/*`, geneValues);
    });
    test('Selecting Gene option advances to step 2 with gene filter options', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');

      // When
      await page.getByTestId('gene-variant-option').click();
      await page.getByTestId('next-btn').click();

      // Then
      await expect(page.getByTestId('step-2')).toBeVisible();
    });
    test.describe('Gene selection', () => {
      test('Gene Help', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();
        await page.getByTestId('next-btn').click();

        await expect(page.getByTestId('gene-help-popup-content')).not.toBeVisible();

        // When
        await page.getByTestId('gene-help-popup').click();

        // Then
        await expect(page.getByTestId('gene-help-popup-content')).toContainText(
          infoColumnDescriptions.Gene_with_variant,
        );
      });
      test('Loads list of genes ', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();
        await page.getByTestId('next-btn').click();

        // Then
        await expect(page.getByLabel(geneValues.results[0])).toBeVisible();
      });
      test('Can search genes', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();
        await page.getByTestId('next-btn').click();

        await expect(page.getByLabel(geneValues.results[0])).toBeVisible();

        // When
        const mockSearchResults = ['G123Z', 'G234Z'];
        await mockApiSuccess(page, `*/**/picsure/search/${resources.hpds}/values/*`, {
          ...geneValues,
          results: mockSearchResults,
        });
        await page.getByPlaceholder('Search...').fill('Z');

        // Then
        await expect(page.getByLabel(geneValues.results[0])).not.toBeVisible();
        await expect(page.getByLabel(mockSearchResults[1])).toBeVisible();
      });
      test('Selected gens move to selected box', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();
        await page.getByTestId('next-btn').click();

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
        await page.getByTestId('next-btn').click();

        const optionsContainer = page.locator('#options-container');
        const selectedContainer = page.locator('#selected-options-container');

        // When
        await optionsContainer.getByLabel(geneValues.results[0]).click();
        await page.locator('#clear').click();

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
        await page.getByTestId('next-btn').click();

        await expect(page.getByTestId('freq-help-popup-content')).not.toBeVisible();

        // When
        await page.getByTestId('freq-help-popup').click();

        // Then
        await expect(page.getByTestId('freq-help-popup-content')).toContainText(
          infoColumnDescriptions.Variant_frequency_as_text,
        );
      });
    });
    test.describe('Consequnce selection', () => {
      test('Consequnce Help', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();
        await page.getByTestId('next-btn').click();

        await expect(page.getByTestId('cons-help-popup-content')).not.toBeVisible();

        // When
        await page.getByTestId('cons-help-popup').click();

        // Then
        await expect(page.getByTestId('cons-help-popup-content')).toContainText(
          infoColumnDescriptions.Variant_consequence_calculated,
        );
        await expect(page.getByTestId('cons-help-popup-content')).toContainText(
          infoColumnDescriptions.Variant_severity,
        );
      });
      test('Selecting parent node selects all children nodes', async ({ page }) => {
        // Given
        await page.goto('/explorer/genome-filter');
        await page.getByTestId('gene-variant-option').click();
        await page.getByTestId('next-btn').click();

        const consPanel = page.getByTestId('variant-consequence-calculated');
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
        await page.getByTestId('next-btn').click();

        const consPanel = page.getByTestId('variant-consequence-calculated');
        const child = consPanel.getByRole('treeitem', { name: 'stop_lost' }).getByRole('checkbox');
        const sibling = consPanel
          .getByRole('treeitem', { name: 'splice_acceptor_variant' })
          .getByRole('checkbox');

        // When
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
        await page.getByTestId('next-btn').click();

        const geneContainer = page.locator('#options-container');
        const geneSummary = page
          .getByTestId('selected-genomic-filters')
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
        await page.getByTestId('next-btn').click();

        const freqContainer = page.getByTestId('select-variant-frequency');
        const freqSummary = page
          .getByTestId('selected-genomic-filters')
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
        await page.getByTestId('next-btn').click();

        const consContainer = page.getByTestId('variant-consequence-calculated');
        const consSummary = page
          .getByTestId('selected-genomic-filters')
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
        await page.getByTestId('next-btn').click();

        await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();
        await page
          .getByTestId('variant-consequence-calculated')
          .getByRole('treeitem', { name: 'High Severity' })
          .getByRole('checkbox')
          .click();
        await page
          .getByTestId('select-genes-of-interest')
          .getByLabel(geneValues.results[0])
          .click();

        const summaryPanel = page.getByTestId('selected-genomic-filters');

        // When
        await page
          .getByTestId('selected-genomic-filters')
          .getByRole('button', { name: 'Clear' })
          .click();

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
      await page.getByTestId('next-btn').click();

      await expect(page.getByTestId('apply-filter-btn')).not.toBeEnabled();

      // When
      await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();

      // Then
      await expect(page.getByTestId('apply-filter-btn')).toBeEnabled();
    });
    test('Apply Filter adds to sidepanel', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('gene-variant-option').click();
      await page.getByTestId('next-btn').click();

      await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();

      // When
      await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
      await page.getByTestId('apply-filter-btn').click();

      // Then
      await expect(page.getByTestId('added-filter-Genomic Filter')).toBeVisible();
    });
  });
  test.describe('SNP filter', () => {
    const validSnp = 'chr17,35269878,GT,A';
    const invalidSnp = 'chr17, 35269878,,A';
    const snpError =
      'Please check that value matches: chromosome (chr#), position, reference allele, variant allele.';
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, `*/**/picsure/search/${resources.hpds}/values/*`, geneValues);
    });
    test('Selecting SNP option advances to step 2 with snp filter options', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');

      // When
      await page.getByTestId('snp-option').click();
      await page.getByTestId('next-btn').click();

      // Then
      await expect(page.getByTestId('step-2')).toBeVisible();
    });
    test('Search box enforces valid snp format', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();
      await page.getByTestId('next-btn').click();

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
      await page.getByTestId('next-btn').click();

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
      await page.getByTestId('next-btn').click();

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
      await page.getByTestId('next-btn').click();

      await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();

      // When
      await page.getByTestId('snp-constraint').selectOption({ label: 'Heterozygous' });

      // Then
      await expect(page.getByTestId('apply-filter-btn')).toBeEnabled();
    });
    test('Apply Filter adds to sidepanel', async ({ page }) => {
      // Given
      await page.goto('/explorer/genome-filter');
      await page.getByTestId('snp-option').click();
      await page.getByTestId('next-btn').click();

      await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
      await page.getByTestId('snp-search-box').fill(validSnp);
      await page.getByTestId('snp-search-btn').click();

      await page.getByTestId('snp-constraint').selectOption({ label: 'Heterozygous' });

      // When
      await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
      await page.getByTestId('apply-filter-btn').click();

      // Then
      await expect(page.getByTestId(`added-filter-${validSnp}`)).toBeVisible();
    });
  });
});

import { expect } from '@playwright/test';
import { mockApiSuccess, test, mockApiConfig } from '../../custom-context';
import {
  geneValues,
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
} from '../../../support/mock-data';
import { userIsLoggedIn, chooseGenomicFilterType } from '../../utils';
import type { Branding } from '#lib/config/branding.ts';
import brandingJson from '../../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

const QUERY = '*/**/picsure/hpds/auth/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page, {
    features: [
      { name: 'ENABLE_GENE_QUERY', value: 'true' },
      { name: 'ENABLE_SNP_QUERY', value: 'true' },
    ],
  });
  await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, searchResults);

  await page.goto('/explorer');
  await userIsLoggedIn(page);
});

test('Selecting Gene option advances to gene filter options', async ({ page }) => {
  // Given
  await page.getByTestId('explorer-genomic-filter-open').click();

  // When
  await chooseGenomicFilterType(page, 'gene');

  // Then
  await expect(page.locator('#genomic-gene-search')).toBeVisible();
});
test.describe('Gene selection', () => {
  test('Loads list of genes ', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');
    await expect(page.locator('#genomic-gene-search')).toBeVisible({ timeout: 10000 });

    // Then
    await expect(page.getByLabel(geneValues.results[0])).toBeVisible();
  });
  test('Can search genes', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    await expect(page.getByLabel(geneValues.results[0])).toBeVisible();

    // When
    const mockSearchResults = ['G123Z', 'G234Z'];
    await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, {
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
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const optionsContainer = page.getByTestId('ui-options-selection-list-available');
    const selectedContainer = page.getByTestId('ui-options-selection-list-selected');

    // When
    await expect(optionsContainer.getByLabel(geneValues.results[0])).toBeVisible();
    await optionsContainer.getByLabel(geneValues.results[0]).click();

    // Then
    await expect(optionsContainer.getByLabel(geneValues.results[0])).not.toBeVisible();
    await expect(selectedContainer.getByLabel(geneValues.results[0])).toBeVisible();
  });
  test('Can clear selected genes', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const optionsContainer = page.getByTestId('ui-options-selection-list-available');
    const selectedContainer = page.getByTestId('ui-options-selection-list-selected');

    // When
    await expect(optionsContainer.getByLabel(geneValues.results[0])).toBeVisible();
    await optionsContainer.getByLabel(geneValues.results[0]).click();
    await page.getByTestId('genomic-gene-clear-selected').click();

    // Then
    await expect(selectedContainer.getByLabel(geneValues.results[0])).not.toBeVisible();
    await expect(optionsContainer.getByLabel(geneValues.results[0])).toBeVisible();
  });
  test('Selecting a gene enables add filter button', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const optionsContainer = page.getByTestId('ui-options-selection-list-available');
    const selectedContainer = page.getByTestId('ui-options-selection-list-selected');

    // When — wait for genes to load before clicking
    await expect(optionsContainer.getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer.getByLabel(geneValues.results[0]).click();

    // Then
    await expect(selectedContainer.getByLabel(geneValues.results[0])).toBeVisible();
    await expect(page.getByTestId('genomic-filter-add')).toBeEnabled();
  });
  test('Unselecting a gene disables add filter button', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const optionsContainer = page.getByTestId('ui-options-selection-list-available');
    const selectedContainer = page.getByTestId('ui-options-selection-list-selected');

    // When — wait for genes to load before clicking
    await expect(optionsContainer.getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer.getByLabel(geneValues.results[0]).click();
    await expect(page.getByTestId('genomic-filter-add')).toBeEnabled();

    // Then
    await selectedContainer.getByLabel(geneValues.results[0]).click();
    await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();
  });
});
test.describe('Frequency selection', () => {
  test('Frequency Help', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    await expect(page.getByTestId('genomic-frequency-help-content')).not.toBeVisible();

    // When
    await page.getByTestId('genomic-frequency-help').click();

    // Then
    await expect(page.getByTestId('genomic-frequency-help-content')).toContainText(
      branding?.help?.popups?.genomicFilter?.frequency,
    );
  });
  test('If only a frequency is selected, the add filter button is disabled', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    // When
    await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();

    // Then
    await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();
  });
  test('If only a frequency is selected, the add filter button is disabled, but then adding a gene enables it', async ({
    page,
  }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    // When
    await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();

    // Then
    await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();

    // When
    await page.getByLabel(geneValues.results[0]).click();

    // Then
    await expect(page.getByTestId('genomic-filter-add')).toBeEnabled();
  });
});
test.describe('Consequnce selection', () => {
  test('Consequnce Help', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    // Wait for the gene filter panel to finish loading before interacting
    await expect(page.locator('#genomic-gene-search')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('genomic-consequence-help-content')).not.toBeVisible();

    // When
    await page.getByTestId('genomic-consequence-help').click();

    // Then
    await expect(page.getByTestId('genomic-consequence-help-content')).toContainText(
      branding?.help?.popups?.genomicFilter?.consequence,
    );
  });
  test('Selecting parent node selects all children nodes', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const consPanel = page.getByTestId('genomic-consequence-panel');
    const parent = consPanel.getByRole('treeitem', { name: 'High Severity' }).getByRole('checkbox');
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
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const consPanel = page.getByTestId('genomic-consequence-panel');
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
  test('Consequences can be chosen from the keyboard', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const tree = page.getByTestId('genomic-consequence-panel').getByRole('tree');
    const parentNode = tree.getByRole('treeitem', { name: 'High Severity' });
    const child = tree.getByRole('treeitem', { name: 'splice_acceptor_variant' });

    // When
    await parentNode.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');

    // Then
    await expect(child).toBeFocused();
    await expect(child).toHaveAttribute('aria-checked', 'true');
    await expect(parentNode).toHaveAttribute('aria-checked', 'mixed');
    await expect(page.locator('#genomic-summary-consequence')).toContainText(
      'splice_acceptor_variant',
    );
  });
  test('When a gene is not selected, the add filter button is disabled', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const consPanel = page.getByTestId('genomic-consequence-panel');
    const parentNode = consPanel.getByRole('treeitem', { name: 'High Severity' });
    const child = consPanel.getByRole('treeitem', { name: 'stop_lost' }).getByRole('checkbox');
    // When
    await parentNode.click();
    await child.click();

    // Then
    await expect(child).toBeChecked();
    await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();
  });
  test('When a gene is not selected, the add filter button is disabled, but then adding a gene enables it', async ({
    page,
  }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const consPanel = page.getByTestId('genomic-consequence-panel');
    const parentNode = consPanel.getByRole('treeitem', { name: 'High Severity' });
    const child = consPanel.getByRole('treeitem', { name: 'stop_lost' }).getByRole('checkbox');
    // When
    await parentNode.click();
    await child.click();

    // Then
    await expect(child).toBeChecked();
    await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();

    // When
    await page.getByLabel(geneValues.results[0]).click();

    // Then
    await expect(page.getByTestId('genomic-filter-add')).toBeEnabled();
  });
});
test.describe('Summary panel', () => {
  test('Displays selected genes', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const geneContainer = page.getByTestId('ui-options-selection-list-available');
    const geneSummary = page
      .getByTestId('genomic-summary-panel')
      .locator('#genomic-summary-variant');

    // When
    await geneContainer.getByLabel(geneValues.results[0]).click();
    await geneContainer.getByLabel(geneValues.results[1]).click();

    // Then
    await expect(geneSummary).toContainText(geneValues.results[0]);
    await expect(geneSummary).toContainText(geneValues.results[1]);
  });
  test('Displays selected frequencies', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const freqContainer = page.getByTestId('genomic-frequency-panel');
    const freqSummary = page
      .getByTestId('genomic-summary-panel')
      .locator('#genomic-summary-frequency');

    // When
    await freqContainer.getByLabel('Rare').click();
    await freqContainer.getByLabel('Common').click();

    // Then
    await expect(freqSummary).toContainText('Rare');
    await expect(freqSummary).toContainText('Common');
  });
  test('Displays selected consequences', async ({ page }) => {
    // Given
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    const consContainer = page.getByTestId('genomic-consequence-panel');
    const consSummary = page
      .getByTestId('genomic-summary-panel')
      .locator('#genomic-summary-consequence');
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
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');

    // Wait for gene panel to fully load before interacting
    await expect(page.locator('#genomic-gene-search')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();
    const highSeverity = page
      .getByTestId('genomic-consequence-panel')
      .getByRole('treeitem', { name: 'High Severity' })
      .getByRole('checkbox');
    await highSeverity.click();
    await page.getByTestId('genomic-gene-panel').getByLabel(geneValues.results[0]).click();

    const summaryPanel = page.getByTestId('genomic-summary-panel');

    // When
    await page.getByTestId('genomic-gene-clear-filters').click();

    // Then
    await expect(summaryPanel.locator('#genomic-summary-consequence')).not.toContainText(
      'stop_lost',
    );
    await expect(summaryPanel.locator('#genomic-summary-frequency')).not.toContainText('Rare');
    await expect(summaryPanel.locator('#genomic-summary-variant')).not.toContainText(
      geneValues.results[0],
    );
    await expect(highSeverity).not.toBeChecked();
  });
});
test('Apply Filters button enables once a selection is made', async ({ page }) => {
  // Given
  await page.getByTestId('explorer-genomic-filter-open').click();
  await chooseGenomicFilterType(page, 'gene');

  await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();
  const optionsContainer = page.getByTestId('ui-options-selection-list-available');

  // When
  await optionsContainer.getByLabel(geneValues.results[0]).click();

  // Then
  await expect(page.getByTestId('genomic-filter-add')).toBeEnabled();
});
test('Apply Filter adds to sidepanel', async ({ page }) => {
  // Given
  await page.getByTestId('explorer-genomic-filter-open').click();
  await chooseGenomicFilterType(page, 'gene');

  const optionsContainer = page.getByTestId('ui-options-selection-list-available');

  await optionsContainer.getByLabel(geneValues.results[0]).click();
  await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();

  // When
  await mockApiSuccess(page, QUERY, 200);
  await page.getByTestId('genomic-filter-add').click();

  // Then
  await expect(page.getByTestId('results-filter-item-genomic')).toBeVisible();
});
test('Clicking edit filter button in results panel returns to genomic filter with correct values', async ({
  page,
}) => {
  // Given
  await page.getByTestId('explorer-genomic-filter-open').click();
  await chooseGenomicFilterType(page, 'gene');

  const optionsContainer = page.getByTestId('ui-options-selection-list-available');
  const selectedContainer = page.getByTestId('ui-options-selection-list-selected');
  await optionsContainer.getByLabel(geneValues.results[0]).click();
  await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();
  await mockApiSuccess(page, QUERY, 200);
  await page.getByTestId('genomic-filter-add').click();

  // When
  await page.waitForURL('**/explorer');
  await page
    .getByTestId('results-filter-item-genomic')
    .getByRole('button', { name: 'Edit Filter' })
    .click();

  // Then
  await expect(selectedContainer.getByLabel(geneValues.results[0])).toBeChecked();
  await expect(page.getByTestId('genomic-frequency-panel').getByLabel('Rare')).toBeChecked();
});
test('Editing filter from results panel updates results panel on save', async ({ page }) => {
  // Given
  await page.getByTestId('explorer-genomic-filter-open').click();
  await chooseGenomicFilterType(page, 'gene');
  const optionsContainer = page.getByTestId('ui-options-selection-list-available');
  await optionsContainer.getByLabel(geneValues.results[0]).click();
  await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();
  await mockApiSuccess(page, QUERY, 200);
  await page.getByTestId('genomic-filter-add').click();

  // When
  await page.waitForURL('**/explorer');
  await page
    .getByTestId('results-filter-item-genomic')
    .getByRole('button', { name: 'Edit Filter' })
    .click();
  await page.getByTestId('genomic-frequency-panel').getByLabel('Novel').click();
  await page.getByTestId('genomic-filter-save').click();
  await page
    .getByTestId('results-filter-item-genomic')
    .getByRole('button', { name: 'See Details' })
    .click();

  // Then
  await expect(
    page.getByTestId('results-filter-item-genomic').getByText(geneValues.results[0]),
  ).toBeVisible();
  await expect(page.getByTestId('results-filter-item-genomic').getByText('Rare')).toBeVisible();
  await expect(page.getByTestId('results-filter-item-genomic').getByText('Novel')).toBeVisible();
});
test('Clicking Genomic Filtering after adding a gene filter navigates to edit filter view', async ({
  page,
}) => {
  // Given
  await page.getByTestId('explorer-genomic-filter-open').click();
  await chooseGenomicFilterType(page, 'gene');
  const optionsContainer = page.getByTestId('ui-options-selection-list-available');
  const selectedContainer = page.getByTestId('ui-options-selection-list-selected');
  await optionsContainer.getByLabel(geneValues.results[0]).click();
  await page.getByTestId('genomic-frequency-panel').getByLabel('Rare').click();
  await mockApiSuccess(page, QUERY, 200);
  await page.getByTestId('genomic-filter-add').click();
  await expect(page.getByTestId('results-filter-item-genomic')).toBeVisible();

  // When
  await page.getByTestId('explorer-genomic-filter-open').click();
  await chooseGenomicFilterType(page, 'gene');

  // Then
  await expect(selectedContainer.getByLabel(geneValues.results[0])).toBeChecked();
  await expect(page.getByTestId('genomic-frequency-panel').getByLabel('Rare')).toBeChecked();
});

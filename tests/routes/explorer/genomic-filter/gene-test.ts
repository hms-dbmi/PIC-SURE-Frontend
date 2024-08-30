import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { geneValues } from '../../../mock-data';
import * as config from '../../../../src/lib/assets/configuration.json' assert { type: 'json' };
import type { Branding } from '$lib/configuration';
//TypeScript is confused by the JSON import so I am fxing it here
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));

const HPDS = process.env.VITE_RESOURCE_HPDS;

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
  await expect(page.getByTestId('back-to-options-btn')).toBeVisible();
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
      branding?.help?.popups?.genomicFilter?.frequency,
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
      branding?.help?.popups?.genomicFilter?.consequence,
    );
  });
  test('Selecting parent node selects all children nodes', async ({ page }) => {
    // Given
    await page.goto('/explorer/genome-filter');
    await page.getByTestId('gene-variant-option').click();

    const consPanel = page.getByTestId('select-calculated-consequence');
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
test('Editing filter from results panel updates results panel on save', async ({ page }) => {
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
  await page.getByTestId('select-variant-frequency').getByLabel('Novel').click();
  await page.getByTestId('save-filter-btn').click();
  await page
    .getByTestId('added-filter-Genomic Filter')
    .getByRole('button', { name: 'See Details' })
    .click();

  // Then
  await expect(page.getByTestId('added-filter-Genomic Filter').getByText('Rare')).toBeVisible();
  await expect(page.getByTestId('added-filter-Genomic Filter').getByText('Novel')).toBeVisible();
});
test('Clicking Genomic Filtering after adding a gene filter navigates to edit filter view', async ({
  page,
}) => {
  // Given
  await page.goto('/explorer/genome-filter');
  await page.getByTestId('gene-variant-option').click();
  await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();
  await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
  await page.getByTestId('add-filter-btn').click();
  await expect(page.getByTestId('added-filter-Genomic Filter')).toBeVisible();

  // When
  await page.getByTestId('genomic-filter-btn').click();
  await page.getByTestId('gene-variant-option').click();

  // Then
  await expect(page.getByTestId('select-variant-frequency').getByLabel('Rare')).toBeChecked();
});

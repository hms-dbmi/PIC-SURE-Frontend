import { expect, type Page } from '@playwright/test';
import { mockApiSuccess, test, mockApiConfig } from '../../custom-context';
import {
  geneValues,
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
} from '../../mock-data';
import { searchFor, userIsLoggedIn } from '../../utils';
import type { Branding } from '$lib/models/Configuration';
import brandingJson from '../../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

// The gene-with-variant flow through the Genotypes tab, which is where genomic filtering
// lives now. The route-based equivalents in gene-test.ts still cover /explorer/genome-filter
// while it survives; that route goes away with ticket 08 and these become the only coverage.

const QUERY = '*/**/picsure/hpds/auth/v3/query/sync';

// BDC: GENE alone, so the tab opens straight onto the gene panels with no method chooser.
const geneOnly = {
  features: [
    { name: 'ENABLE_GENE_QUERY', value: 'true' },
    { name: 'ENABLE_SNP_QUERY', value: 'false' },
  ],
};
// NHANES: both, so the method chooser comes first.
const bothEnabled = {
  features: [
    { name: 'ENABLE_GENE_QUERY', value: 'true' },
    { name: 'ENABLE_SNP_QUERY', value: 'true' },
  ],
};

const modeLink = (page: Page, id: string) => page.getByTestId(`search-mode-tab-${id}`);
const optionsContainer = (page: Page) => page.locator('#options-container');
const selectedContainer = (page: Page) => page.locator('#selected-options-container');
const addFilterBtn = (page: Page) => page.getByTestId('add-filter-btn');
const summaryPanel = (page: Page) => page.getByTestId('summary-of-selected-filters');

/** Enters the tab the way a user does - through the mode bar - rather than by URL. */
async function openGenotypesTab(page: Page) {
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await modeLink(page, 'genotypes').click();
  await expect(page).toHaveURL(/\/explorer\/genotypes$/);
  await expect(page.getByTestId('genotypes-tab')).toBeVisible();
}

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page, geneOnly);
  await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, searchResults);
});

test.describe('The tab itself', () => {
  test('opens straight onto the gene panels, with no method chooser', async ({ page }) => {
    // Given
    await openGenotypesTab(page);

    // Then the three panels, the summary and the action button, in that order
    await expect(page.getByTestId('search-for-gene-with-variant')).toBeVisible();
    await expect(page.getByTestId('select-calculated-consequence')).toBeVisible();
    await expect(page.getByTestId('select-variant-frequency')).toBeVisible();
    await expect(summaryPanel(page)).toBeVisible();
    await expect(addFilterBtn(page)).toBeVisible();
    await expect(page.locator('#gene-search')).toBeVisible();

    // And no method chooser, there being only one method enabled
    await expect(page.getByTestId('gene-variant-option')).toHaveCount(0);
    await expect(page.getByTestId('snp-option')).toHaveCount(0);
  });

  // The mode bar is the page's navigation now, which is why the page carries no title of its
  // own and no back button.
  test('keeps the mode bar visible with Genotypes active, and adds no second navigation', async ({
    page,
  }) => {
    // Given
    await openGenotypesTab(page);

    // Then
    await expect(page.getByTestId('search-mode-tabs')).toBeVisible();
    await expect(modeLink(page, 'genotypes')).toHaveAttribute('aria-current', 'page');
    await expect(modeLink(page, 'phenotypes')).not.toHaveAttribute('aria-current');
    await expect(page.getByRole('heading', { name: 'Genomic Filtering' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Back to Explore' })).toHaveCount(0);
  });

  test('is reachable by URL, keeping the mode bar and the panels', async ({ page }) => {
    // Given
    await page.goto('/explorer/genotypes');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('genotypes-tab')).toBeVisible();
    await expect(page.locator('#gene-search')).toBeVisible();
    await expect(modeLink(page, 'genotypes')).toHaveAttribute('aria-current', 'page');
  });

  test('shows the method chooser when both query types are enabled', async ({ page }) => {
    // Given
    await mockApiConfig(page, bothEnabled);

    // When
    await openGenotypesTab(page);

    // Then neither interface until a method is picked
    await expect(page.getByTestId('gene-variant-option')).toBeVisible();
    await expect(page.getByTestId('snp-option')).toBeVisible();
    await expect(page.locator('#gene-search')).toHaveCount(0);
    await expect(page.locator('#snp-search')).toHaveCount(0);
    await expect(addFilterBtn(page)).toHaveCount(0);

    // When
    await page.getByTestId('gene-variant-option').click();

    // Then
    await expect(page.locator('#gene-search')).toBeVisible();
    await expect(addFilterBtn(page)).toBeVisible();
  });
});

test.describe('Gene selection', () => {
  test('loads the list of genes', async ({ page }) => {
    // Given
    await openGenotypesTab(page);

    // Then
    await expect(page.getByLabel(geneValues.results[0])).toBeVisible({ timeout: 10000 });
  });

  test('can search genes', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(page.getByLabel(geneValues.results[0])).toBeVisible({ timeout: 10000 });

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

  test('moves a selected gene to the selected box', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });

    // When
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // Then
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).not.toBeVisible();
    await expect(selectedContainer(page).getByLabel(geneValues.results[0])).toBeVisible();
  });

  test('can clear the selected genes', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // When
    await page.getByTestId('clear-selected-genes-btn').click();

    // Then
    await expect(selectedContainer(page).getByLabel(geneValues.results[0])).not.toBeVisible();
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible();
  });
});

test.describe('The Add Filter button', () => {
  // The gene is the required field; a frequency or a consequence on its own is not a filter.
  test('is disabled, and says why, until a gene is selected', async ({ page }) => {
    // Given
    await openGenotypesTab(page);

    // Then
    await expect(addFilterBtn(page)).toBeDisabled();
    await expect(addFilterBtn(page)).toHaveAttribute('title', 'A gene is required');

    // When
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // Then
    await expect(addFilterBtn(page)).toBeEnabled();
    await expect(addFilterBtn(page)).toHaveAttribute('title', 'Add Filter');

    // When the gene is unselected again
    await selectedContainer(page).getByLabel(geneValues.results[0]).click();

    // Then
    await expect(addFilterBtn(page)).toBeDisabled();
  });

  test('stays disabled when only a frequency is selected', async ({ page }) => {
    // Given
    await openGenotypesTab(page);

    // When
    await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();

    // Then
    await expect(addFilterBtn(page)).toBeDisabled();

    // When
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // Then
    await expect(addFilterBtn(page)).toBeEnabled();
  });

  test('stays disabled when only a consequence is selected', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    const consPanel = page.getByTestId('select-calculated-consequence');

    // When
    await consPanel.getByRole('treeitem', { name: 'High Severity' }).getByRole('checkbox').click();

    // Then
    await expect(addFilterBtn(page)).toBeDisabled();

    // When
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // Then
    await expect(addFilterBtn(page)).toBeEnabled();
  });
});

test.describe('Consequence and frequency panels', () => {
  test('selecting a severity selects every consequence under it', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
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

  test('a consequence can be unselected on its own', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
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

  test('shows the consequence help text', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(page.locator('#gene-search')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('cons-help-popup-content')).not.toBeVisible();

    // When
    await page.getByTestId('cons-help-popup').click();

    // Then
    await expect(page.getByTestId('cons-help-popup-content')).toContainText(
      branding?.help?.popups?.genomicFilter?.consequence,
    );
  });

  test('shows the frequency help text', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(page.getByTestId('freq-help-popup-content')).not.toBeVisible();

    // When
    await page.getByTestId('freq-help-popup').click();

    // Then
    await expect(page.getByTestId('freq-help-popup-content')).toContainText(
      branding?.help?.popups?.genomicFilter?.frequency,
    );
  });
});

test.describe('Summary of Selected Filters', () => {
  test('lists the selected genes, frequencies and consequences', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });

    // When
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();
    await optionsContainer(page).getByLabel(geneValues.results[1]).click();
    await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();
    await page.getByTestId('select-variant-frequency').getByLabel('Common').click();
    await page
      .getByTestId('select-calculated-consequence')
      .getByRole('treeitem', { name: 'High Severity' })
      .getByRole('checkbox')
      .click();

    // Then
    await expect(summaryPanel(page).locator('#selected-variant')).toContainText(
      geneValues.results[0],
    );
    await expect(summaryPanel(page).locator('#selected-variant')).toContainText(
      geneValues.results[1],
    );
    await expect(summaryPanel(page).locator('#selected-frequency')).toContainText('Rare');
    await expect(summaryPanel(page).locator('#selected-frequency')).toContainText('Common');
    // The severity group is a grouping, not a consequence, so only its children are filters
    await expect(summaryPanel(page).locator('#selected-consequence')).not.toContainText(
      'High Severity',
    );
    await expect(summaryPanel(page).locator('#selected-consequence')).toContainText('stop_lost');
  });

  test('its Clear button clears every selection', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(page.locator('#gene-search')).toBeVisible({ timeout: 10000 });
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

    // When
    await page.getByTestId('clear-gene-filters-btn').click();

    // Then
    await expect(summaryPanel(page).locator('#selected-consequence')).not.toContainText(
      'stop_lost',
    );
    await expect(summaryPanel(page).locator('#selected-frequency')).not.toContainText('Rare');
    await expect(summaryPanel(page).locator('#selected-variant')).not.toContainText(
      geneValues.results[0],
    );
    await expect(addFilterBtn(page)).toBeDisabled();
  });
});

test.describe('Adding the filter', () => {
  test('creates it, clears the panels and returns to the Phenotypes tab', async ({ page }) => {
    // Given
    await openGenotypesTab(page);
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();
    await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();
    await page
      .getByTestId('select-calculated-consequence')
      .getByRole('treeitem', { name: 'High Severity' })
      .getByRole('checkbox')
      .click();

    // When
    await mockApiSuccess(page, QUERY, 200);
    await addFilterBtn(page).click();

    // Then it lands in the cohort panel, on the Phenotypes tab
    await expect(page).toHaveURL(/\/explorer$/);
    await expect(modeLink(page, 'phenotypes')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('added-filter-genomic')).toBeVisible();

    // And the working state is gone, so the tab starts over
    await modeLink(page, 'genotypes').click();
    await expect(summaryPanel(page).locator('#selected-variant')).not.toContainText(
      geneValues.results[0],
    );
    await expect(summaryPanel(page).locator('#selected-frequency')).not.toContainText('Rare');
    await expect(summaryPanel(page).locator('#selected-consequence')).not.toContainText(
      'stop_lost',
    );
    await expect(addFilterBtn(page)).toBeDisabled();
  });

  // Otherwise the address bar stops agreeing with the results the user lands back on.
  test('carries the active search back to the Phenotypes tab', async ({ page }) => {
    // Given a search, then the tab
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await searchFor(page, 'age');
    await expect(page).toHaveURL(/\?search=age$/);
    await modeLink(page, 'genotypes').click();
    await expect(page).toHaveURL(/\/explorer\/genotypes\?search=age$/);

    // When
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();
    await mockApiSuccess(page, QUERY, 200);
    await addFilterBtn(page).click();

    // Then
    await expect(page).toHaveURL(/\/explorer\?search=age$/);
    await expect(page.getByTestId('search-box')).toHaveValue('age');
  });

  // Adding the filter opens the cohort panel, which is what starts the count - the panel is
  // the only thing that asks for one, so nothing here has to open it by hand.
  //
  // The count answers from the query it is sent rather than from a flag flipped at some
  // moment, so there is no ordering to get wrong: 1,320 is reachable only through a query
  // that carries the genomic filter, and a query that lost it would show 9,999 and fail.
  test('updates the participant count', async ({ page }) => {
    // Given a cohort of 9,999 without the filter and 1,320 with it
    await page.route(QUERY, async (route) => {
      const genomicFilters = route.request().postDataJSON()?.query?.genomicFilters ?? [];
      await route.fulfill({ json: genomicFilters.length > 0 ? '1320' : '9999' });
    });
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    await modeLink(page, 'genotypes').click();
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // When
    await addFilterBtn(page).click();

    // Then
    await expect(page.getByTestId('added-filter-genomic')).toBeVisible();
    await expect(page.locator('#result-count-number')).toHaveText('1,320');
  });
});

// The whole reason the tab's working state is held in module-level stores: Genotypes is a
// route, so switching modes unmounts the page.
test.describe('Leaving the tab mid-edit', () => {
  test('keeps the in-progress gene selection across a trip to Phenotypes', async ({ page }) => {
    // Given a part-built filter
    await openGenotypesTab(page);
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();
    await page.getByTestId('select-variant-frequency').getByLabel('Rare').click();

    // When
    await modeLink(page, 'phenotypes').click();
    await expect(page).toHaveURL(/\/explorer$/);
    await modeLink(page, 'genotypes').click();

    // Then
    await expect(selectedContainer(page).getByLabel(geneValues.results[0])).toBeChecked();
    await expect(page.getByTestId('select-variant-frequency').getByLabel('Rare')).toBeChecked();
    await expect(summaryPanel(page).locator('#selected-variant')).toContainText(
      geneValues.results[0],
    );
    await expect(addFilterBtn(page)).toBeEnabled();
  });

  test('keeps the chosen method too, where there is one to choose', async ({ page }) => {
    // Given both methods enabled, and Gene chosen
    await mockApiConfig(page, bothEnabled);
    await openGenotypesTab(page);
    await page.getByTestId('gene-variant-option').click();
    await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
      timeout: 10000,
    });
    await optionsContainer(page).getByLabel(geneValues.results[0]).click();

    // When
    await modeLink(page, 'phenotypes').click();
    await expect(page).toHaveURL(/\/explorer$/);
    await modeLink(page, 'genotypes').click();

    // Then the user is back in the gene interface, not at the chooser
    await expect(page.locator('#gene-search')).toBeVisible();
    await expect(selectedContainer(page).getByLabel(geneValues.results[0])).toBeChecked();
  });
});

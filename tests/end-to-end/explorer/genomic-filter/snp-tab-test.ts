import { expect, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  geneValues,
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
} from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

// The specific-variant flow through the Genotypes tab. The route-based equivalents in
// snp-test.ts still cover /explorer/genome-filter while it survives; that route goes away
// with ticket 08 and these become the only coverage.

const QUERY = '*/**/picsure/hpds/auth/v3/query/sync';

const validSnp = 'chr17,35269878,GT,A';
const validSnpConstraint = 'Heterozygous';
const validSnpConstraintValue = '0/1';
const secondSnp = 'chr1,1234567,A,G';
const secondSnpConstraint = 'Homozygous';
const invalidSnp = 'chr17, 35269878,,A';
const snpError =
  'Please check that value matches: chromosome (chr#), position, reference allele, variant allele.';

// NHANES: both query types, so the method chooser comes first.
const bothEnabled = {
  features: [
    { name: 'ENABLE_GENE_QUERY', value: 'true' },
    { name: 'ENABLE_SNP_QUERY', value: 'true' },
  ],
};
// A deployment with SNP alone has no choice to offer, so the tab opens onto SNP search.
const snpOnly = {
  features: [
    { name: 'ENABLE_GENE_QUERY', value: 'false' },
    { name: 'ENABLE_SNP_QUERY', value: 'true' },
  ],
};

const modeLink = (page: Page, id: string) => page.getByTestId(`search-mode-tab-${id}`);
const addFilterBtn = (page: Page) => page.getByTestId('add-filter-btn');
const summaryPanel = (page: Page) => page.getByTestId('summary-of-selected-filters');
const snpChip = (page: Page) => page.getByTestId('added-filter-snp-variant');
const geneChip = (page: Page) => page.getByTestId('added-filter-genomic');
const optionsContainer = (page: Page) => page.locator('#options-container');

async function openGenotypesTab(page: Page) {
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await modeLink(page, 'genotypes').click();
  await expect(page).toHaveURL(/\/explorer\/genotypes$/);
  await expect(page.getByTestId('genotypes-tab')).toBeVisible();
}

/** Opens the tab, chooses the SNP method, and lands on a found variant ready to constrain. */
async function openSnpSearch(page: Page) {
  await openGenotypesTab(page);
  await expect(page.getByTestId('snp-option')).toBeVisible();
  await page.getByTestId('snp-option').click();
  await expect(page.locator('#snp-search')).toBeVisible();
}

/** Searches for a variant, constrains it and saves it into the panel. */
async function saveVariant(page: Page, search: string, constraint: string) {
  await mockApiSuccess(page, QUERY, 12);
  await page.getByTestId('snp-search-box').fill(search);
  await page.getByTestId('snp-search-btn').click();
  await page.getByTestId('snp-constraint').selectOption({ label: constraint });
  await page.getByTestId('snp-save-btn').click();
}

/** Applies a variant filter through the tab, leaving the browser back on Phenotypes. */
async function applySnpFilter(page: Page) {
  await openSnpSearch(page);
  await saveVariant(page, validSnp, validSnpConstraint);
  await mockApiSuccess(page, QUERY, 200);
  await addFilterBtn(page).click();
  await expect(snpChip(page)).toBeVisible();
}

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page, bothEnabled);
  await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, searchResults);
});

test('choosing the SNP method reveals the variant interface', async ({ page }) => {
  // Given
  await openGenotypesTab(page);
  await expect(page.getByTestId('gene-variant-option')).toBeVisible();
  await expect(page.getByTestId('snp-option')).toBeVisible();

  // When
  await page.getByTestId('snp-option').click();

  // Then
  await expect(page.locator('#snp-search')).toBeVisible();
  await expect(page.locator('#gene-search')).toHaveCount(0);
  await expect(summaryPanel(page)).toBeVisible();
  await expect(addFilterBtn(page)).toBeVisible();
});

test('opens straight onto the variant interface when SNP is the only method', async ({ page }) => {
  // Given
  await mockApiConfig(page, snpOnly);

  // When
  await openGenotypesTab(page);

  // Then
  await expect(page.getByTestId('gene-variant-option')).toHaveCount(0);
  await expect(page.getByTestId('snp-option')).toHaveCount(0);
  await expect(page.locator('#snp-search')).toBeVisible();
});

test('the search box enforces the variant format', async ({ page }) => {
  // Given
  await openSnpSearch(page);

  // When
  await page.getByTestId('snp-search-box').fill(invalidSnp);

  // Then
  const message = await page
    .getByTestId('snp-search-box')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(message).toContain(snpError);
});

test('a search returning no participants reports the variant was not found', async ({ page }) => {
  // Given
  await openSnpSearch(page);

  // When
  await mockApiSuccess(page, QUERY, 0);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();

  // Then
  await expect(page.locator('.alert-message')).toBeVisible();
});

test('a search returning participants offers the genotype constraint', async ({ page }) => {
  // Given
  await openSnpSearch(page);

  // When
  await mockApiSuccess(page, QUERY, 12);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();

  // Then
  await expect(page.getByTestId('snp-constraint')).toBeVisible();
});

test('the Add Filter button is disabled, and says why, until a variant is saved', async ({
  page,
}) => {
  // Given
  await openSnpSearch(page);

  // Then
  await expect(addFilterBtn(page)).toBeDisabled();
  await expect(addFilterBtn(page)).toHaveAttribute('title', 'A SNP is required');

  // When
  await mockApiSuccess(page, QUERY, 12);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();
  await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('snp-save-btn').click();

  // Then
  await expect(addFilterBtn(page)).toBeEnabled();
  await expect(addFilterBtn(page)).toHaveAttribute('title', 'Add Filter');
});

test.describe('Summary of Selected Filters', () => {
  test.beforeEach(async ({ page }) => {
    await openSnpSearch(page);
    await mockApiSuccess(page, QUERY, 12);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
  });

  test('lists a saved variant with its constraint', async ({ page }) => {
    // When
    await page.getByTestId('snp-save-btn').click();

    // Then
    await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();
    await expect(summaryPanel(page).getByText(validSnpConstraint)).toBeVisible();
  });

  test('its edit icon reloads the variant for another constraint', async ({ page }) => {
    // Given
    await page.getByTestId('snp-save-btn').click();

    // When
    await page.getByTestId(`snp-edit-btn-${validSnp}`).click();

    // Then
    await expect(page.getByTestId('snp-constraint')).toHaveValue(validSnpConstraintValue);
  });

  test('its delete icon removes the variant and disables Add Filter', async ({ page }) => {
    // Given
    await page.getByTestId('snp-save-btn').click();

    // When
    await page.getByTestId(`snp-delete-btn-${validSnp}`).click();

    // Then
    await expect(summaryPanel(page).getByText(validSnp)).not.toBeVisible();
    await expect(addFilterBtn(page)).toBeDisabled();
  });
});

test.describe('Adding the filter', () => {
  test('creates it, returns to the Phenotypes tab, and goes on showing it', async ({ page }) => {
    // Given
    await openSnpSearch(page);
    await mockApiSuccess(page, QUERY, 12);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
    await page.getByTestId('snp-save-btn').click();

    // When
    await mockApiSuccess(page, QUERY, 200);
    await addFilterBtn(page).click();

    // Then
    await expect(page).toHaveURL(/\/explorer$/);
    await expect(modeLink(page, 'phenotypes')).toHaveAttribute('aria-current', 'page');
    await expect(snpChip(page)).toBeVisible();

    // And the tab goes on showing the filter the cohort now holds - the variant interface
    // rather than the chooser, because only one of the two methods has anything to show
    await modeLink(page, 'genotypes').click();
    await expect(page.locator('#snp-search')).toBeVisible();
    await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();
    await expect(addFilterBtn(page)).toHaveText(/Update Filter/);
  });

  // Adding the filter opens the cohort panel, which is what starts the count - the panel is
  // the only thing that asks for one, so nothing here has to open it by hand.
  //
  // The variant search and the cohort count share an endpoint, so they are told apart by
  // answering 12 to the search and 1,320 to whatever comes after it. Showing 1,320 therefore
  // means the panel took the count made after the filter, not the search that preceded it.
  test('updates the participant count', async ({ page }) => {
    // Given a variant the search finds
    await mockApiSuccess(page, QUERY, 12);
    await openSnpSearch(page);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
    await page.getByTestId('snp-save-btn').click();

    // When the cohort it produces is counted
    await mockApiSuccess(page, QUERY, 1320);
    await addFilterBtn(page).click();

    // Then
    await expect(page.getByTestId('added-filter-snp-variant')).toBeVisible();
    await expect(page.locator('#result-count-number')).toHaveText('1,320');
  });
});

test('leaving the tab mid-edit keeps the saved variants and the chosen method', async ({
  page,
}) => {
  // Given a saved variant, not yet added as a filter
  await openSnpSearch(page);
  await mockApiSuccess(page, QUERY, 12);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();
  await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('snp-save-btn').click();

  // When
  await modeLink(page, 'phenotypes').click();
  await expect(page).toHaveURL(/\/explorer$/);
  await modeLink(page, 'genotypes').click();

  // Then the user is back in the variant interface, not at the chooser
  await expect(page.locator('#snp-search')).toBeVisible();
  await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();
  await expect(addFilterBtn(page)).toBeEnabled();
});

// The same requirement as for the gene filter, on the deployment that offers both methods:
// there is only ever one variant filter, so the tab shows the one the cohort holds.
test.describe('The applied filter', () => {
  test('is loaded into the variant panel on a fresh visit', async ({ page }) => {
    // Given a filter applied and then a page load, which leaves nothing in memory: the panel
    // can only be showing what the cohort holds
    await applySnpFilter(page);
    await page.goto('/explorer/genotypes');
    await userIsLoggedIn(page);

    // Then the variant interface, not the chooser, because only one method has anything to show
    await expect(page.locator('#snp-search')).toBeVisible();
    await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();
    await expect(summaryPanel(page).getByText(validSnpConstraint)).toBeVisible();
    await expect(addFilterBtn(page)).toHaveText(/Update Filter/);
  });

  test('is replaced in place by Update Filter, keeping the variants already in it', async ({
    page,
  }) => {
    // Given
    await applySnpFilter(page);
    await modeLink(page, 'genotypes').click();
    await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();

    // When a second variant is added to it
    await saveVariant(page, secondSnp, secondSnpConstraint);
    await mockApiSuccess(page, QUERY, 1320);
    await addFilterBtn(page).click();

    // Then the cohort still has one variant filter, holding both variants
    await expect(snpChip(page)).toHaveCount(1);
    await snpChip(page).getByRole('button', { name: 'See details' }).click();
    await expect(snpChip(page)).toContainText(validSnp);
    await expect(snpChip(page)).toContainText(secondSnp);
    await expect(page.locator('#result-count-number')).toHaveText('1,320');
  });

  test('empties the panel and offers Add Filter again once it is removed', async ({ page }) => {
    // Given
    await applySnpFilter(page);
    await modeLink(page, 'genotypes').click();
    await expect(addFilterBtn(page)).toHaveText(/Update Filter/);

    // When removed from its chip, in the cohort panel above the tab
    await snpChip(page).getByRole('button', { name: 'Remove Filter' }).click();

    // Then
    await expect(snpChip(page)).toHaveCount(0);
    await expect(summaryPanel(page).getByText(validSnp)).not.toBeVisible();
    await expect(addFilterBtn(page)).toHaveText(/Add Filter/);
    await expect(addFilterBtn(page)).toBeDisabled();
  });

  test('is opened for editing by its chip, with no edit parameter in the URL', async ({ page }) => {
    // Given
    await applySnpFilter(page);

    // When
    await snpChip(page).getByRole('button', { name: 'Edit Filter' }).click();

    // Then the tab, on the method the filter belongs to
    await expect(page).toHaveURL(/\/explorer\/genotypes$/);
    await expect(page.locator('#snp-search')).toBeVisible();
    await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();
    await expect(addFilterBtn(page)).toHaveText(/Update Filter/);
  });

  // The other half of the requirement: arriving loads the applied filter, but coming back
  // mid-edit must not - including when what the user did was empty the panel.
  test('is left out of a draft in progress, across a trip to Phenotypes', async ({ page }) => {
    // Given the applied filter loaded into the panel
    await applySnpFilter(page);
    await modeLink(page, 'genotypes').click();
    await expect(summaryPanel(page).getByText(validSnp)).toBeVisible();

    // When the user takes the variant out without applying that
    await page.getByTestId(`snp-delete-btn-${validSnp}`).click();
    await expect(summaryPanel(page).getByText(validSnp)).not.toBeVisible();
    await modeLink(page, 'phenotypes').click();
    await expect(page).toHaveURL(/\/explorer$/);
    await modeLink(page, 'genotypes').click();

    // Then the panel is still as they left it, and the applied filter still applies
    await expect(summaryPanel(page).getByText(validSnp)).not.toBeVisible();
    await expect(addFilterBtn(page)).toBeDisabled();
    await expect(snpChip(page)).toHaveCount(1);
  });
});

// This deployment can hold both genomic filters at once, which leaves the tab with two filters
// and one interface to show them in. Removing either must not move the user to the other: the
// panels emptying and the button going back to Add Filter is what they are owed, and they
// cannot see it happen on an interface they have been taken off.
test('removing one of two applied filters leaves the user on the one it emptied', async ({
  page,
}) => {
  // Given a variant filter, and then a gene filter alongside it
  await applySnpFilter(page);
  await modeLink(page, 'genotypes').click();
  await page.getByTestId('gene-variant-option').click();
  await expect(optionsContainer(page).getByLabel(geneValues.results[0])).toBeVisible({
    timeout: 10000,
  });
  await optionsContainer(page).getByLabel(geneValues.results[0]).click();
  await addFilterBtn(page).click();
  await expect(geneChip(page)).toBeVisible();
  await expect(snpChip(page)).toBeVisible();

  // When the user is in the gene interface and takes the gene filter out from its chip
  await modeLink(page, 'genotypes').click();
  await expect(page.locator('#gene-search')).toBeVisible();
  await expect(addFilterBtn(page)).toHaveText(/Update Filter/);
  await geneChip(page).getByRole('button', { name: 'Remove Filter' }).click();

  // Then they are still there, watching it empty
  await expect(page.locator('#gene-search')).toBeVisible();
  await expect(page.locator('#snp-search')).toHaveCount(0);
  await expect(addFilterBtn(page)).toHaveText(/Add Filter/);
  await expect(addFilterBtn(page)).toBeDisabled();
  // And the variant filter, which they were not editing, is untouched
  await expect(snpChip(page)).toHaveCount(1);
});

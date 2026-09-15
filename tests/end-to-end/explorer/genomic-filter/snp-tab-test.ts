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
  test('creates it, clears the panels and returns to the Phenotypes tab', async ({ page }) => {
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
    await expect(page.getByTestId('added-filter-snp-variant')).toBeVisible();

    // And the working state is gone: both methods are enabled, so the tab is back at the
    // chooser with nothing saved behind it
    await modeLink(page, 'genotypes').click();
    await expect(page.getByTestId('snp-option')).toBeVisible();
    await page.getByTestId('snp-option').click();
    await expect(summaryPanel(page).getByText(validSnp)).not.toBeVisible();
    await expect(addFilterBtn(page)).toBeDisabled();
  });

  // No need to open the cohort panel by hand: adding the filter opens it.
  test('updates the participant count', async ({ page }) => {
    // Given a count that answers 9,999 for the cohort as it stands
    let participants = '9999';
    await page.route(QUERY, (route) => route.fulfill({ json: participants }));
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    await modeLink(page, 'genotypes').click();
    await page.getByTestId('snp-option').click();
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
    await page.getByTestId('snp-save-btn').click();

    // When the cohort the filter produces answers differently
    participants = '1320';
    await addFilterBtn(page).click();

    // Then the panel shows the new count, not the one from before the filter
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

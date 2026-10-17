import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  geneValues,
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
} from '../../../support/mock-data';
import { userIsLoggedIn } from '../../utils';

const queryResultPath = '*/**/picsure/hpds/auth/query/sync';

const validSnp = 'chr17,35269878,GT,A';
const validSnpConstraint = 'Heterozygous';
const validSnpConstraintValue = '0/1';
const invalidSnp = 'chr17, 35269878,,A';
const snpError =
  'Please check that value matches: chromosome (chr#), position, reference allele, variant allele.';

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
});

test('Selecting SNP option advances snp filter options', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();

  // When
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  // Then
  await expect(page.locator('#genomic-snp-search')).toBeVisible();
});
test('Search box enforces valid snp format', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  // When
  await page.getByTestId('genomic-snp-search-input').fill(invalidSnp);

  // Then
  const message = await page
    .getByTestId('genomic-snp-search-input')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  await expect(message).toContain(snpError);
});
test('Search request returns 0, indicating no SNP was found', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  // When
  await mockApiSuccess(page, queryResultPath, 0);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();

  // Then
  await expect(page.locator('.alert-message')).toBeVisible();
});
test('Search returns > 0, indicating SNP was found', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  // When
  await mockApiSuccess(page, queryResultPath, 12);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();

  // Then
  await expect(page.getByTestId('genomic-snp-constraint')).toBeVisible();
});
test('Apply Filters button enables once genotype interest selection is made', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  await mockApiSuccess(page, queryResultPath, 12);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();

  // When
  await page.getByTestId('genomic-snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('genomic-snp-save').click();

  // Then
  await expect(page.getByTestId('genomic-filter-add')).toBeEnabled();
});
test.describe('Summary Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await page.getByTestId('explorer-genomic-filter-open').click();
    await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
    await page.getByTestId('genomic-type-snp').click();
    await mockApiSuccess(page, queryResultPath, 12);
    await page.getByTestId('genomic-snp-search-input').fill(validSnp);
    await page.getByTestId('genomic-snp-search').click();
    await page.getByTestId('genomic-snp-constraint').selectOption({ label: validSnpConstraint });
  });
  test('Adds to summary box once snp is saved', async ({ page }) => {
    // When
    await page.getByTestId('genomic-snp-save').click();

    // Then
    await expect(page.getByTestId('genomic-summary-panel').getByText(validSnp)).toBeVisible();
    await expect(
      page.getByTestId('genomic-summary-panel').getByText(validSnpConstraint),
    ).toBeVisible();
  });
  test('Clicking edit icon in summary panel loads constraint selection for snp', async ({
    page,
  }) => {
    // Given
    await page.getByTestId('genomic-snp-save').click();

    // When
    await page.getByTestId(`genomic-snp-edit-${validSnp}`).click();

    // Then
    await expect(page.getByTestId('genomic-snp-constraint')).toHaveValue(validSnpConstraintValue);
  });
  test('Editing snp with new constraint selection updates summary', async ({ page }) => {
    // Given
    const secondConstraint = 'Homozygous';
    const secondConstraintLabel = 'Homozygous';
    await page.getByTestId('genomic-snp-save').click();

    // When
    await page.getByTestId(`genomic-snp-edit-${validSnp}`).click();
    await page.getByTestId('genomic-snp-constraint').selectOption({ label: secondConstraint });
    await page.getByTestId('genomic-snp-save').click();

    // Then
    await expect(page.getByTestId('genomic-summary-panel').getByText(validSnp)).toBeVisible();
    await expect(
      page.getByTestId('genomic-summary-panel').getByText(secondConstraintLabel),
    ).toBeVisible();
  });
  test('Clicking delete icon removes snp from summary panel', async ({ page }) => {
    // Given
    await page.getByTestId('genomic-snp-save').click();

    // When
    await page.getByTestId(`genomic-snp-delete-${validSnp}`).click();

    // Then
    await expect(page.getByTestId('genomic-summary-panel').getByText(validSnp)).not.toBeVisible();
    await expect(
      page.getByTestId('genomic-summary-panel').getByText(validSnpConstraint),
    ).not.toBeVisible();
  });
  test('Clicking delete icon on only snp disables add filter button', async ({ page }) => {
    // Given
    await page.getByTestId('genomic-snp-save').click();

    // When
    await page.getByTestId(`genomic-snp-delete-${validSnp}`).click();

    // Then
    await expect(page.getByTestId('genomic-filter-add')).toBeDisabled();
  });
});
test('Apply Filter adds to sidepanel', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  await mockApiSuccess(page, queryResultPath, 12);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();

  await page.getByTestId('genomic-snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('genomic-snp-save').click();

  // When
  await mockApiSuccess(page, queryResultPath, 200);
  await page.getByTestId('genomic-filter-add').click();

  // Then
  await expect(page.getByTestId('results-filter-item-snp-variant')).toBeVisible();
});
test('Clicking edit filter button in results panel returns to snp filter with correct values', async ({
  page,
}) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();
  await mockApiSuccess(page, queryResultPath, 12);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();
  await page.getByTestId('genomic-snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('genomic-snp-save').click();
  await mockApiSuccess(page, queryResultPath, 200);
  await page.getByTestId('genomic-filter-add').click();

  // When
  await page.waitForURL('**/explorer');
  await page
    .getByTestId('results-filter-item-snp-variant')
    .getByRole('button', { name: 'Edit Filter' })
    .click();

  // Then
  await expect(page.getByTestId('genomic-summary-panel').getByText(validSnp)).toBeVisible();
  await expect(
    page.getByTestId('genomic-summary-panel').getByText(validSnpConstraint),
  ).toBeVisible();
});
test('Editing filter from results panel updates results panel on save', async ({ page }) => {
  // Given
  const secondConstraint = 'Homozygous';
  const secondConstraintLabel = 'Homozygous';
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();
  await mockApiSuccess(page, queryResultPath, 12);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();
  await page.getByTestId('genomic-snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('genomic-snp-save').click();
  await mockApiSuccess(page, queryResultPath, 200);
  await page.getByTestId('genomic-filter-add').click();

  // When
  await page.waitForURL('**/explorer');
  await page
    .getByTestId('results-filter-item-snp-variant')
    .getByRole('button', { name: 'Edit Filter' })
    .click();
  await page.getByTestId(`genomic-snp-edit-${validSnp}`).click();
  await page.getByTestId('genomic-snp-constraint').selectOption({ label: secondConstraint });
  await page.getByTestId('genomic-snp-save').click();
  await page.getByTestId('genomic-filter-save').click();
  await page
    .getByTestId('results-filter-item-snp-variant')
    .getByRole('button', { name: 'See Details' })
    .click();

  // Then
  await expect(
    page.getByTestId('results-filter-item-snp-variant').getByText(validSnp),
  ).toBeVisible();
  await expect(
    page.getByTestId('results-filter-item-snp-variant').getByText(secondConstraintLabel),
  ).toBeVisible();
});
test('Clicking Genomic Filtering after adding a snp filter navigates to edit filter view', async ({
  page,
}) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();
  await mockApiSuccess(page, queryResultPath, 12);
  await page.getByTestId('genomic-snp-search-input').fill(validSnp);
  await page.getByTestId('genomic-snp-search').click();
  await page.getByTestId('genomic-snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('genomic-snp-save').click();
  await mockApiSuccess(page, queryResultPath, 200);
  await page.getByTestId('genomic-filter-add').click();

  // When
  await page.getByTestId('explorer-genomic-filter-open').click();
  await expect(page.getByTestId('genomic-type-snp')).toBeVisible();
  await page.getByTestId('genomic-type-snp').click();

  // Then
  await expect(page.getByTestId('genomic-summary-panel').getByText(validSnp)).toBeVisible();
  await expect(
    page.getByTestId('genomic-summary-panel').getByText(validSnpConstraint),
  ).toBeVisible();
});

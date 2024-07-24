import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { geneValues } from '../../../mock-data';

const HPDS = process.env.VITE_RESOURCE_HPDS;

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
test('Apply Filters button enables once genotype interest selection is made', async ({ page }) => {
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
  await expect(page.getByTestId('summary-of-selected-filters').getByText(validSnp)).toBeVisible();
  await expect(
    page.getByTestId('summary-of-selected-filters').getByText(snpConstraint),
  ).toBeVisible();
});

import { expect } from '@playwright/test';
import { mockApiSuccess, getUserTest } from '../../../custom-context';
import { geneValues, mockLoginResponse } from '../../../mock-data';

const HPDS = process.env.VITE_RESOURCE_HPDS;

const validSnp = 'chr17,35269878,GT,A';
const validSnpConstraint = 'Heterozygous';
const validSnpConstraintValue = '0/1';
const invalidSnp = 'chr17, 35269878,,A';
const snpError =
  'Please check that value matches: chromosome (chr#), position, reference allele, variant allele.';
const userTest = getUserTest();

userTest.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, `*/**/picsure/search/${HPDS}/values/*`, geneValues);
});
userTest('Selecting SNP option advances snp filter options', async ({ page }) => {
  // Given
  await page.goto(mockLoginResponse);
  await page.waitForURL('/');
  await page.locator('#nav-link-explorer').click();
  await page.waitForURL('/explorer');
  await page.getByTestId('genomic-filter-btn').click();

  // When
  await page.getByTestId('snp-option').click();

  // Then
  await expect(page.locator('#snp-search')).toBeVisible();
});
userTest('Search box enforces valid snp format', async ({ page }) => {
  // Given
  await page.goto(mockLoginResponse);
  await page.waitForURL('/');
  await page.locator('#nav-link-explorer').click();
  await page.waitForURL('/explorer');
  await page.getByTestId('genomic-filter-btn').click();
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
userTest('Search request returns 0, indicating no SNP was found', async ({ page }) => {
  // Given
  await page.goto(mockLoginResponse);
  await page.waitForURL('/');
  await page.locator('#nav-link-explorer').click();
  await page.waitForURL('/explorer');
  await page.getByTestId('genomic-filter-btn').click();
  await page.getByTestId('snp-option').click();

  // When
  await mockApiSuccess(page, '*/**/picsure/query/sync', 0);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();

  // Then
  await expect(page.locator('.alert-message')).toBeVisible();
});
userTest('Search returns > 0, indicating SNP was found', async ({ page }) => {
  // Given
  await page.goto(mockLoginResponse);
  await page.waitForURL('/');
  await page.locator('#nav-link-explorer').click();
  await page.waitForURL('/explorer');
  await page.getByTestId('genomic-filter-btn').click();
  await page.getByTestId('snp-option').click();

  // When
  await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();

  // Then
  await expect(page.getByTestId('snp-constraint')).toBeVisible();
});
userTest(
  'Apply Filters button enables once genotype interest selection is made',
  async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);
    await page.waitForURL('/');
    await page.locator('#nav-link-explorer').click();
    await page.waitForURL('/explorer');
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('snp-option').click();

    await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();

    // When
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
    await page.getByTestId('snp-save-btn').click();

    // Then
    await expect(page.getByTestId('add-filter-btn')).toBeEnabled();
  },
);
userTest.describe('Summary Panel', () => {
  userTest.beforeEach(async ({ page }) => {
    await page.goto(mockLoginResponse);
    await page.waitForURL('/');
    await page.locator('#nav-link-explorer').click();
    await page.waitForURL('/explorer');
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('snp-option').click();
    await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
  });
  userTest('Adds to summary box once snp is saved', async ({ page }) => {
    // When
    await page.getByTestId('snp-save-btn').click();

    // Then
    await expect(page.getByTestId('summary-of-selected-filters').getByText(validSnp)).toBeVisible();
    await expect(
      page.getByTestId('summary-of-selected-filters').getByText(validSnpConstraint),
    ).toBeVisible();
  });
  userTest(
    'Clicking edit icon in summary panel loads constraint selection for snp',
    async ({ page }) => {
      // Given
      await page.getByTestId('snp-save-btn').click();

      // When
      await page.getByTestId(`snp-edit-btn-${validSnp}`).click();

      // Then
      await expect(page.getByTestId('snp-constraint')).toHaveValue(validSnpConstraintValue);
    },
  );
  userTest('Editing snp with new constraint selection updates summary', async ({ page }) => {
    // Given
    const secondConstraint = 'Exclude variant';
    const secondConstraintLabel = 'Excluded';
    await page.getByTestId('snp-save-btn').click();

    // When
    await page.getByTestId(`snp-edit-btn-${validSnp}`).click();
    await page.getByTestId('snp-constraint').selectOption({ label: secondConstraint });
    await page.getByTestId('snp-save-btn').click();

    // Then
    await expect(page.getByTestId('summary-of-selected-filters').getByText(validSnp)).toBeVisible();
    await expect(
      page.getByTestId('summary-of-selected-filters').getByText(secondConstraintLabel),
    ).toBeVisible();
  });
  userTest('Clicking delete icon removes snp from summary panel', async ({ page }) => {
    // Given
    await page.getByTestId('snp-save-btn').click();

    // When
    await page.getByTestId(`snp-delete-btn-${validSnp}`).click();

    // Then
    await expect(
      page.getByTestId('summary-of-selected-filters').getByText(validSnp),
    ).not.toBeVisible();
    await expect(
      page.getByTestId('summary-of-selected-filters').getByText(validSnpConstraint),
    ).not.toBeVisible();
  });
  userTest('Clicking delete icon on only snp disables add filter button', async ({ page }) => {
    // Given
    await page.getByTestId('snp-save-btn').click();

    // When
    await page.getByTestId(`snp-delete-btn-${validSnp}`).click();

    // Then
    await expect(page.getByTestId('add-filter-btn')).toBeDisabled();
  });
});
userTest('Apply Filter adds to sidepanel', async ({ page }) => {
  // Given
  await page.goto(mockLoginResponse);
  await page.waitForURL('/');
  await page.locator('#nav-link-explorer').click();
  await page.waitForURL('/explorer');
  await page.getByTestId('genomic-filter-btn').click();
  await page.getByTestId('snp-option').click();

  await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();

  await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('snp-save-btn').click();

  // When
  await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
  await page.getByTestId('add-filter-btn').click();

  // Then
  await expect(page.getByTestId('added-filter-snp-variant')).toBeVisible();
});
userTest(
  'Clicking edit filter button in results panel returns to snp filter with correct values',
  async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);
    await page.waitForURL('/');
    await page.locator('#nav-link-explorer').click();
    await page.waitForURL('/explorer');
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('snp-option').click();
    await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
    await page.getByTestId('snp-save-btn').click();
    await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
    await page.getByTestId('add-filter-btn').click();

    // When
    await page.waitForURL('**/explorer');
    await page
      .getByTestId('added-filter-snp-variant')
      .getByRole('button', { name: 'Edit Filter' })
      .click();

    // Then
    await expect(page.getByTestId('summary-of-selected-filters').getByText(validSnp)).toBeVisible();
    await expect(
      page.getByTestId('summary-of-selected-filters').getByText(validSnpConstraint),
    ).toBeVisible();
  },
);
userTest('Editing filter from results panel updates results panel on save', async ({ page }) => {
  // Given
  const secondConstraint = 'Exclude variant';
  const secondConstraintLabel = 'Excluded';
  await page.goto(mockLoginResponse);
  await page.waitForURL('/');
  await page.locator('#nav-link-explorer').click();
  await page.waitForURL('/explorer');
  await page.getByTestId('genomic-filter-btn').click();
  await page.getByTestId('snp-option').click();
  await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
  await page.getByTestId('snp-search-box').fill(validSnp);
  await page.getByTestId('snp-search-btn').click();
  await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
  await page.getByTestId('snp-save-btn').click();
  await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
  await page.getByTestId('add-filter-btn').click();

  // When
  await page.waitForURL('**/explorer');
  await page
    .getByTestId('added-filter-snp-variant')
    .getByRole('button', { name: 'Edit Filter' })
    .click();
  await page.getByTestId(`snp-edit-btn-${validSnp}`).click();
  await page.getByTestId('snp-constraint').selectOption({ label: secondConstraint });
  await page.getByTestId('snp-save-btn').click();
  await page.getByTestId('save-filter-btn').click();
  await page
    .getByTestId('added-filter-snp-variant')
    .getByRole('button', { name: 'See Details' })
    .click();

  // Then
  await expect(page.getByTestId('added-filter-snp-variant').getByText(validSnp)).toBeVisible();
  await expect(
    page.getByTestId('added-filter-snp-variant').getByText(secondConstraintLabel),
  ).toBeVisible();
});
userTest(
  'Clicking Genomic Filtering after adding a snp filter navigates to edit filter view',
  async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);
    await page.waitForURL('/');
    await page.locator('#nav-link-explorer').click();
    await page.waitForURL('/explorer');
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('snp-option').click();
    await mockApiSuccess(page, '*/**/picsure/query/sync', 12);
    await page.getByTestId('snp-search-box').fill(validSnp);
    await page.getByTestId('snp-search-btn').click();
    await page.getByTestId('snp-constraint').selectOption({ label: validSnpConstraint });
    await page.getByTestId('snp-save-btn').click();
    await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
    await page.getByTestId('add-filter-btn').click();

    // When
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('snp-option').click();

    // Then
    await expect(page.getByTestId('summary-of-selected-filters').getByText(validSnp)).toBeVisible();
    await expect(
      page.getByTestId('summary-of-selected-filters').getByText(validSnpConstraint),
    ).toBeVisible();
  },
);

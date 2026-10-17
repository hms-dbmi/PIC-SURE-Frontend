import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
  geneValues,
} from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page, {
    features: [
      { name: 'ENABLE_GENE_QUERY', value: 'true' },
      { name: 'ENABLE_SNP_QUERY', value: 'true' },
    ],
  });
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, searchResults);
});

test('Clicking the Genomic filter button navigates to genomic filter page', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);

  // When
  await page.getByTestId('explorer-genomic-filter-open').click();

  // Then
  await expect(page).toHaveURL('/explorer/genome-filter');
  await expect(
    page.getByRole('heading').getByText('Genomic Filtering', { exact: true }),
  ).toBeTruthy();
});

test.describe('Single-flag branches', () => {
  test('ENABLE_GENE_QUERY=true / ENABLE_SNP_QUERY=false skips the type selector and goes straight to gene search', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'false' },
      ],
    });
    await mockApiSuccess(page, '*/**/picsure/hpds/auth/search/values?*', geneValues);
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('explorer-genomic-filter-open').click();

    // Then
    await expect(page).toHaveURL('/explorer/genome-filter');
    await expect(page.getByTestId('genomic-type-gene')).not.toBeVisible();
    await expect(page.getByTestId('genomic-type-snp')).not.toBeVisible();
    await expect(page.locator('#gene-search')).toBeVisible();
  });

  test('ENABLE_GENE_QUERY=false / ENABLE_SNP_QUERY=true skips the type selector and goes straight to SNP search', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'false' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
      ],
    });
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('explorer-genomic-filter-open').click();

    // Then
    await expect(page).toHaveURL('/explorer/genome-filter');
    await expect(page.getByTestId('genomic-type-gene')).not.toBeVisible();
    await expect(page.getByTestId('genomic-type-snp')).not.toBeVisible();
    await expect(page.locator('#snp-search')).toBeVisible();
  });

  test('ENABLE_GENE_QUERY=false / ENABLE_SNP_QUERY=false hides the genomic filter entry point entirely', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'false' },
        { name: 'ENABLE_SNP_QUERY', value: 'false' },
      ],
    });

    // When
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('explorer-genomic-filter-open')).not.toBeVisible();
  });
});

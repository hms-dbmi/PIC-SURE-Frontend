import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import { searchResults, facetsResponse, searchResultPath, facetResultPath } from '../../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, searchResults);
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

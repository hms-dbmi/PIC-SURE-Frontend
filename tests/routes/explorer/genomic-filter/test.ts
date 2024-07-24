import { expect } from '@playwright/test';
import { test } from '../../../custom-context';

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

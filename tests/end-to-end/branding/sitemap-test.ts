import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import { userIsLoggedIn } from '../utils';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Sitemap feature-gating', () => {
  test('A sitemap link with a feature gate shows when the feature is enabled', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [{ name: 'ANALYZE_API', value: 'true' }],
    });

    // When
    await page.goto('/help');
    await userIsLoggedIn(page);

    // Then
    const sitemap = page.locator('#sitemap-footer');
    await expect(sitemap.getByRole('link', { name: 'Explore' })).toBeVisible();
    await expect(sitemap.getByRole('link', { name: 'Analyze' })).toBeVisible();
    await expect(sitemap.getByRole('link', { name: 'Manage Datasets' })).toBeVisible();
  });

  test('A sitemap link with a feature gate disappears when the feature is disabled, without hiding the rest of the section', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, {
      features: [{ name: 'ANALYZE_API', value: 'false' }],
    });

    // When
    await page.goto('/help');
    await userIsLoggedIn(page);

    // Then
    const sitemap = page.locator('#sitemap-footer');
    await expect(sitemap.getByRole('link', { name: 'Explore' })).toBeVisible();
    await expect(sitemap.getByRole('link', { name: 'Analyze' })).not.toBeVisible();
    await expect(sitemap.getByRole('link', { name: 'Manage Datasets' })).toBeVisible();
  });
});

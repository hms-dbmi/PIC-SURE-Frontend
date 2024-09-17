import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';

import { mockDashboard } from '../../mock-data';

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/dashboard', mockDashboard);
  });
  test.describe('Dashboard table', () => {
    test('Has a dashboard once request loads', async ({ page }) => {
      // Given
      await page.goto('/dashboard');

      // Then
      await expect(page.locator('#data-container')).toBeVisible();
    });
    test('Dashboard renders buttons', async ({ page }) => {
      // Given
      await page.goto('/dashboard');

      // Then
      await expect((await page.getByText('More Info').all()).length).toBe(2);
      await expect(page.getByText('More Info').first()).toHaveClass(
        'btn variant-ghost-primary hover:variant-filled-primary',
      );
    });
  });
});

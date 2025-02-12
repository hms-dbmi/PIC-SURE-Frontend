import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';

import { mockDashboard } from '../../mock-data';

test.use({ storageState: '.playwright/.auth/generalUser.json' });

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
      const buttons = await page.getByText('More Info').all();

      expect(buttons.length).toBe(mockDashboard.rows.length);
      await expect(buttons[0]).toHaveClass(
        'btn variant-ghost-primary hover:variant-filled-primary',
      );
    });
    test('Dashboard renders disabled buttons when link is not available', async ({ page }) => {
      // Given
      await page.goto('/dashboard');

      // Then
      await expect(page.getByText('More Info').last()).toHaveClass(
        'btn variant-ghost-primary hover:variant-filled-primary opacity-50 cursor-not-allowed',
      );
    });
    test('Dashboard rows are clickable and open drawer', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/dashboard-drawer/1', {
        dashboardDrawerList: [{ ...mockDashboard.rows[0] }],
      });
      await page.goto('/dashboard');

      // When
      await page.locator('#row-0-col-0').click();

      // Then
      await expect(page.getByTestId('drawer')).toBeVisible();
      await expect(page.getByTestId('drawer').getByTestId('drawer-title')).toHaveText(
        mockDashboard.rows[0].name as string,
      );
    });
    test('Dashboard drawer displays correct data', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/dashboard-drawer/1', {
        ...mockDashboard.rows[0],
      });
      await page.goto('/dashboard');

      // When
      await page.locator('#row-0-col-0').click();

      // Then
      await expect(page.getByTestId('drawer')).toBeVisible();
      const entries = Object.entries(mockDashboard.rows[0]);
      const drawerText = await page.getByTestId('drawer').getByTestId('drawer-details').innerText();
      const lines = drawerText.split('\n');

      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        if (key === 'additional_info_link' || key === 'dataset_id') continue;

        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .toLowerCase()
          .trim();
        expect(lines[i].toLowerCase()).toBe(`${formattedKey}: ${value}`.toLowerCase());
      }
    });
  });
});

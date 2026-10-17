import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';

import { mockDashboard } from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'DASHBOARD_DRAWER', value: 'true' },
        { name: 'DASHBOARD', value: 'true' },
      ],
    });
    await mockApiSuccess(page, '*/**/picsure/dictionary/dashboard', mockDashboard);
  });
  test.describe('Dashboard table', () => {
    test('Has a dashboard once request loads', async ({ page }) => {
      // Given
      await page.goto('/dashboard');
      await userIsLoggedIn(page);

      // Then
      await expect(page.locator('#dashboard-data')).toBeVisible();
    });
    test('Dashboard renders buttons', async ({ page }) => {
      // Given
      await page.goto('/dashboard');
      await userIsLoggedIn(page);

      // Then
      await expect(page.getByText('More Info')).toHaveCount(mockDashboard.rows.length);
    });
    test('Dashboard renders disabled buttons when link is not available', async ({ page }) => {
      // Given
      await page.goto('/dashboard');
      await userIsLoggedIn(page);

      // Then
      const unavailableLink = page.getByRole('button', { name: 'More Info' });
      await expect(unavailableLink).toBeDisabled();
      await expect(unavailableLink).toHaveAttribute('title', 'Link not available');

      // When
      await unavailableLink.click({ force: true });

      // Then
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
    test('Dashboard rows are clickable and open drawer', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/dictionary/dashboard-drawer/1', {
        dashboardDrawerList: [{ ...mockDashboard.rows[0] }],
      });
      await page.goto('/dashboard');
      await userIsLoggedIn(page);

      // When
      await page.locator('#dashboard-table-row-0-col-0').click();

      // Then
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('dialog').getByTestId('dashboard-drawer-title')).toHaveText(
        mockDashboard.rows[0].name as string,
      );
    });
    test('Dashboard drawer displays correct data', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/dictionary/dashboard-drawer/1', {
        ...mockDashboard.rows[0],
      });
      await page.goto('/dashboard');
      await userIsLoggedIn(page);

      // When
      await page.locator('#dashboard-table-row-0-col-0').click();

      // Then
      await expect(page.getByRole('dialog')).toBeVisible();
      const entries = Object.entries(mockDashboard.rows[0]);
      const drawerText = await page
        .getByRole('dialog')
        .getByTestId('dashboard-drawer-details')
        .innerText();
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

test.describe('Dashboard page with the feature off', () => {
  test('/dashboard redirects to the home page', async ({ page }) => {
    // Given
    await mockApiConfig(page, { features: [{ name: 'DASHBOARD', value: 'false' }] });

    // When
    await page.goto('/dashboard');

    // Then
    await expect(page).toHaveURL('/');
    await expect(page.locator('#dashboard-data')).toBeHidden();
  });
});

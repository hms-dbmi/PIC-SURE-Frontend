import { expect } from '@playwright/test';
import { test } from '../../custom-context';
import { users as mockUsers } from '../../../src/lib/stores/mock/data';

// TODO: Add api specific tests when api data is implemented
test.describe('users', () => {
  test('Has Add user button', async ({ page }) => {
    // Given
    await page.goto('/user');

    // Then
    await expect(page.locator('#add-used-btn')).toBeVisible();
  });
  test('Displays multiple IDP tables', async ({ page }) => {
    // Given
    await page.goto('/user');

    // Then
    await expect(page.locator('#add-used-btn')).toBeVisible();
  });
  test('Correct user goes to the right idp table', async ({ page }) => {
    // Given
    await page.goto('/user');

    // Then
    await Promise.all(
      mockUsers.map((mockUser) =>
        expect(
          page.locator(`#user-table-${mockUser.connection.label.replaceAll(' ', '_')}`),
        ).toContainText(mockUser.email),
      ),
    );
  });
});

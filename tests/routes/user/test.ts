import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import { users as mockUsers, connections as mockConns, roles as mockRoles } from '../../mock-data';

// TODO: Add api specific tests when api data is implemented
test.describe('users', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, '*/**/psama/user', mockUsers);
    await mockApiSuccess(context, '*/**/psama/role', mockRoles);
    await mockApiSuccess(context, '*/**/psama/connection', mockConns);
  });
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

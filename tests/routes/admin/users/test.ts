import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../../custom-context';
import {
  users as mockUsers,
  connections as mockConns,
  roles as mockRoles,
} from '../../../mock-data';

const validationText = {
  invalidEmail: /([Pp]lease )?([Ee]nter|[Ii]nclude) an ('@' in the )?email address.?/,
  option: /([Pp]lease )?[Ss]elect an item in the list.?/,
};

// TODO: Add api specific tests when api data is implemented
test.describe('users', () => {
  test.beforeEach(async ({ context }) => {
    await mockApiSuccess(context, '*/**/psama/user', mockUsers);
    await mockApiSuccess(context, '*/**/psama/role', mockRoles);
    await mockApiSuccess(context, '*/**/psama/connection', mockConns);
  });
  test('Has Add user button', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // Then
    await expect(page.getByTestId('add-user-btn')).toBeVisible();
  });
  test('Displays multiple IDP tables', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // Then
    await Promise.all(
      mockConns.map((connection) =>
        expect(page.locator(`#user-table-${connection.label.replaceAll(' ', '_')}`)).toBeVisible(),
      ),
    );
  });
  test('Correct user goes to the right idp table', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // Then
    await Promise.all(
      mockUsers.map((mockUser) =>
        expect(
          page.locator(`#user-table-${mockUser.connection.label.replaceAll(' ', '_')}`),
        ).toContainText(mockUser.email),
      ),
    );
  });
  test('Add user button takes user to new user page', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // When
    await page.getByTestId('add-user-btn').click();

    // Then
    await page.waitForURL('**/admin/users/new');
    await expect(page.url()).toContain('admin/users/new');
  });
  test('User form has pre-populated roles', async ({ page }) => {
    // Given
    await page.goto('/admin/users/new');
    const checkboxes = page
      .getByTestId('privilege-checkboxes')
      .getByText(mockRoles[0].name, { exact: true });

    // Then
    await expect(checkboxes).toBeVisible();
  });
  test('User form cancel button navigates back to users page', async ({ page }) => {
    // Given
    await page.goto('/admin/users/new');

    // When
    await page.getByText('Cancel', { exact: true }).click();

    // Then
    await page.waitForURL('**/admin/users');
    await expect(page.url()).toContain('/admin/users');
  });
  test('User form returns to users page with success message', async ({ page }) => {
    // Given
    const newUser = {
      email: 'butter@cream.com',
      connection: mockConns[0],
      roles: [mockRoles[0]],
    };
    await mockApiSuccess(page, '*/**/psama/user', { content: [newUser] });
    await page.goto('/admin/users/new');

    // When
    await page.getByLabel('Active').check();
    await page.getByLabel('Email').fill(newUser.email);
    await page.getByLabel('Connection').selectOption(newUser.connection.label);
    await page.getByLabel(mockRoles[0].name).check();
    await page.getByRole('button', { name: 'Save' }).click();

    // Then
    await page.waitForURL('**/admin/users');
    await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
    await expect(page.url()).toContain('/admin/users');
  });
  test('User form returns error message on api fail', async ({ page }) => {
    // Given
    await mockApiFail(page, '*/**/psama/user', 'failed');
    await page.goto('/admin/users/new');

    // When
    await page.getByLabel('Active').check();
    await page.getByLabel('Email').fill('butter@cream.com');
    await page.getByLabel('Connection').selectOption(mockConns[0].label);
    await page.getByLabel(mockRoles[0].name).check();
    await page.getByRole('button', { name: 'Save' }).click();

    // Then
    await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
  });
  test('Role form enforces required email format', async ({ page }) => {
    // Given
    await page.goto('/admin/users/new');

    // When
    await page.getByLabel('Email').fill('cvfbfbd');
    await page.getByLabel('Connection').selectOption(mockConns[0].label);
    await page.getByRole('button', { name: 'Save' }).click();

    // Then
    const invalid = await page
      .getByLabel('Email')
      .evaluate((element: HTMLInputElement) => element.validationMessage);
    await expect(invalid).toMatch(validationText.invalidEmail);
  });
  test('User form enforces connection selection', async ({ page }) => {
    // Given
    await page.goto('/admin/users/new');

    // When
    await page.getByLabel('Email').fill('butter@cream.com');
    await page.getByRole('button', { name: 'Save' }).click();

    // Then
    const noOption = await page
      .getByLabel('Connection')
      .evaluate((element: HTMLSelectElement) => element.validationMessage);
    await expect(noOption).toMatch(validationText.option);
  });
  test('View row icon takes user to view privilege form', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // When
    await page.getByTestId(`user-view-btn-${mockUsers[0].uuid}`).click();

    // Then
    await page.waitForURL(`**/admin/users/${mockUsers[0].uuid}`);
    await expect(page.url()).toContain(`/admin/users/${mockUsers[0].uuid}`);
  });
  test('Clicking row takes user to view priviledge form', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // When
    await page
      .locator(`#user-table-${mockConns[0].label.replaceAll(' ', '_')} table tbody tr`)
      .first()
      .click();

    // Then
    await page.waitForURL(`**/admin/users/${mockUsers[0].uuid}`);
    await expect(page.url()).toContain(`/admin/users/${mockUsers[0].uuid}`);
  });
  test('Edit row icon takes user to edit privilege form', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // When
    await page.getByTestId(`user-edit-btn-${mockUsers[0].uuid}`).click();

    // Then
    await page.waitForURL(`**/admin/users/${mockUsers[0].uuid}/edit`);
    await expect(page.url()).toContain(`/admin/users/${mockUsers[0].uuid}/edit`);
  });
});

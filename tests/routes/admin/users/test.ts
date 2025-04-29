import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiSuccessByMethod, mockApiFail } from '../../../custom-context';
import {
  users as mockUsers,
  connections as mockConns,
  roles as mockRoles,
} from '../../../mock-data';

const validationText = {
  invalidEmail: /([Pp]lease )?([Ee]nter|[Ii]nclude) an ('@' in the )?email address.?/,
  option: /([Pp]lease )?[Ss]elect an item in the list.?/,
};

test.use({ storageState: 'tests/.auth/superUser.json' });

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
    expect(page.url()).toContain('admin/users/new');
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
    expect(page.url()).toContain('/admin/users');
  });
  test('User form returns to users page with success message', async ({ page }) => {
    // Given
    const newUser = {
      email: 'butter@cream.com',
      connection: mockConns[0],
      roles: [mockRoles[0]],
    };
    await mockApiSuccessByMethod(page, '*/**/psama/user', 'POST', [newUser]);
    await page.goto('/admin/users/new');

    // When
    await page.getByLabel('Active').check();
    await page.getByLabel('Email').fill(newUser.email);
    await page.getByLabel('Connection').selectOption(newUser.connection.label);
    await page.getByLabel(mockRoles[0].name).check();
    await page.getByRole('button', { name: 'Save' }).click();

    // Then
    await page.waitForURL('**/admin/users');
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('data-type', 'success');
    expect(page.url()).toContain('/admin/users');
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
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('data-type', 'error');
  });
  test('User form enforces required email format', async ({ page }) => {
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
    expect(invalid).toMatch(validationText.invalidEmail);
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
    expect(noOption).toMatch(validationText.option);
  });
  test('User form enforces adding unique email and connection', async ({ page }) => {
    // Given
    await page.goto('/admin/users/new');

    // When
    await page.getByLabel('Email').fill(mockUsers[0].email);
    await page.getByLabel('Connection').selectOption(mockUsers[0].connection.label);
    await page.getByLabel(mockRoles[0].name).check();
    await page.getByRole('button', { name: 'Save' }).click();

    // Then
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('data-type', 'error');
  });
  test('Clicking row takes user to edit priviledge form', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // When
    await page
      .locator(`#user-table-${mockConns[0].label.replaceAll(' ', '_')} table tbody tr`)
      .first()
      .click();

    // Then
    await page.waitForURL(`**/admin/users/${mockUsers[0].uuid}/edit`);
    expect(page.url()).toContain(`/admin/users/${mockUsers[0].uuid}/edit`);
  });
  test('Edit row icon takes user to edit privilege form', async ({ page }) => {
    // Given
    await page.goto('/admin/users');

    // When
    await page.getByTestId(`user-${mockUsers[0].uuid}-edit-btn`).click();

    // Then
    await page.waitForURL(`**/admin/users/${mockUsers[0].uuid}/edit`);
    expect(page.url()).toContain(`/admin/users/${mockUsers[0].uuid}/edit`);
  });
});

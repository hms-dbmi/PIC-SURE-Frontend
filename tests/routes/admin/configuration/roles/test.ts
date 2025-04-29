import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../../../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
} from '../../../../mock-data';

const validationText = {
  empty: /([Pp]lease )?[Ff]ill out this field.?/,
};

test.use({ storageState: 'tests/.auth/superUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, '*/**/psama/role', mockRoles);
  await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
  await mockApiSuccess(page, '*/**/psama/application', mockApps);
  await mockApiSuccess(page, '*/**/psama/connection', mockConnections);
});

test('Has Roles management table', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // Then
  await expect(page.locator('#role-table .table')).toBeVisible();
});
test('Has add role button', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // Then
  await expect(page.getByTestId('add-role')).toBeVisible();
});
test('Add role button takes user to new role page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId('add-role').click();

  // Then
  await page.waitForURL('**/admin/configuration/role/new');
  expect(page.url()).toContain('admin/configuration/role/new');
});
test('Role form has pre-populated priviledges', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');
  const checkboxes = page
    .getByTestId('privilege-checkboxes')
    .getByText(mockPrivileges[0].name, { exact: true });

  // Then
  await expect(checkboxes).toBeVisible();
});
test('Role form cancel button navigates back to configuration page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');

  // When
  await page.getByText('Cancel', { exact: true }).click();

  // Then
  await page.waitForURL('**/admin/configuration');
  expect(page.url()).toContain('/admin/configuration');
});
test('Role form returns to configuration page with success message', async ({ page }) => {
  // Given
  const newRole = {
    name: 'coconut',
    description: 'walnut',
    privileges: [mockPrivileges[0]],
  };
  await mockApiSuccess(page, '*/**/psama/role', { content: [newRole] });
  await page.goto('/admin/configuration/role/new');

  // When
  await page.getByLabel('Name').fill(newRole.name);
  await page.getByLabel('Description').fill(newRole.description);
  await page.getByLabel(mockPrivileges[0].name).check();
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  await page.waitForURL('**/admin/configuration');
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'success');
  expect(page.url()).toContain('/admin/configuration');
});
test('Role form returns error message on api fail', async ({ page }) => {
  // Given
  await mockApiFail(page, '*/**/psama/role', 'failed');
  await page.goto('/admin/configuration/role/new');

  // When
  await page.getByLabel('Name').fill('coconut');
  await page.getByLabel('Description').fill('walnut');
  await page.getByLabel(mockPrivileges[0].name).check();
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'error');
});
test('Role form enforces required name length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');

  // When
  await page.getByLabel('Name').fill('');
  await page.getByLabel('Description').fill('walnut');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('Name')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Role form enforces required description length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');

  // When
  await page.getByLabel('Name').fill('coconut');
  await page.getByLabel('Description').fill('');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('Description')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Role form enforces required at least one selected privilege', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');

  // When
  await page.getByLabel('Name').fill('coconut');
  await page.getByLabel('Description').fill('something');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  await expect(page.getByTestId('validation-error')).toBeVisible();
});
test('Clicking row takes user to edit role form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.locator('#role-table table tbody tr').first().click();

  // Then
  await page.waitForURL(`**/admin/configuration/role/${mockRoles[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);
});
test('Edit row icon takes user to edit role form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(`role-${mockRoles[0].uuid}-edit-btn`).click();

  // Then
  await page.waitForURL(`**/admin/configuration/role/${mockRoles[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);
});
test('Edit role form has pre-populated values', async ({ page }) => {
  // Given
  await mockApiSuccess(page, `*/**/psama/role/${mockRoles[0].uuid}`, mockRoles[0]);
  await page.goto(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);

  // Then
  await expect(page.getByLabel('Name')).toHaveValue(mockRoles[0].name);
  await expect(page.getByLabel('Description')).toHaveValue(mockRoles[0].description);
  await expect(page.getByLabel(mockRoles[0].privileges[0].name)).toBeChecked();
});
test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
  const modalId = `role-${mockRoles[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(modalId + '-btn').click();

  // Then
  await expect(page.getByTestId(modalId)).toBeVisible();
});
test('Delete gives success message', async ({ page }) => {
  const modalId = `role-${mockRoles[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');
  await mockApiSuccess(page, `*/**/psama/role/${mockRoles[0].uuid}`, {});

  // When
  await page.getByTestId(modalId + '-btn').click();
  await page.getByTestId(modalId).getByRole('button', { name: 'Yes' }).click();

  // Then
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'success');
});
test('Delete gives error message on api failure', async ({ page }) => {
  const modalId = `role-${mockRoles[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');
  await mockApiFail(page, `*/**/psama/role/${mockRoles[0].uuid}`, 'failed');

  // When
  await page.getByTestId(modalId + '-btn').click();
  await page.getByTestId(modalId).getByRole('button', { name: 'Yes' }).click();

  // Then
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'error');
});

test.describe('Admin on Configuration page', () => {
  test.use({ storageState: 'tests/.auth/adminUser.json' });
  test('Action and add button(s) are disabled when not top admin', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration');

    // Then
    // Check that all edit buttons are disabled
    for (const role of mockRoles) {
      await expect(page.getByTestId(`role-${role.uuid}-edit-btn`)).toBeDisabled();
    }

    // Check that all delete buttons are disabled
    for (const role of mockRoles) {
      await expect(page.getByTestId(`role-${role.uuid}-delete-btn`)).toBeDisabled();
    }
    // Check that add role button is disabled
    await expect(page.getByTestId('add-role')).toHaveClass(/opacity-50 pointer-events-none/);
  });
  test('Error alert is visible when not top admin', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration');
    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test('Can still navigate to edit page but its actions and inputs are disabled', async ({
    page,
  }) => {
    // Given
    await page.goto('/admin/configuration');
    // When
    await page.locator('#role-table table tbody tr').first().click();
    // Then
    await expect(page.getByTestId('role-form')).toBeVisible();
    await expect(page.getByTestId('role-form')).toHaveAttribute('disabled', '');
    await expect(page.getByTestId('role-save-btn')).toBeDisabled();
    await expect(page.getByTestId('role-cancel-btn')).not.toBeDisabled();
  });
});

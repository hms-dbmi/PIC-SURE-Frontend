import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../../../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
} from '../../../../mock-data';

const validationText = {
  empty: 'Please fill out this field.',
  option: 'Please select an item in the list.',
};

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
  await expect(page.url()).toContain('admin/configuration/role/new');
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
  await expect(page.url()).toContain('/admin/configuration');
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
  await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
  await expect(page.url()).toContain('/admin/configuration');
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
  await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
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
  await expect(empty).toContain(validationText.empty);
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
  await expect(empty).toContain(validationText.empty);
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
  await expect(page.url()).toContain(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);
});
test('Edit row icon takes user to edit role form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(`role-edit-btn-${mockRoles[0].uuid}`).click();

  // Then
  await page.waitForURL(`**/admin/configuration/role/${mockRoles[0].uuid}/edit`);
  await expect(page.url()).toContain(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);
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
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`).click();

  // Then
  await expect(page.getByTestId('modal')).toBeVisible();
});
test('Delete gives success message', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await mockApiSuccess(page, `*/**/psama/role/${mockRoles[0].uuid}`, {});

  // When
  await page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`).click();
  await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

  // Then
  await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
});
test('Delete gives error message on api failure', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await mockApiFail(page, `*/**/psama/role/${mockRoles[0].uuid}`, 'failed');

  // When
  await page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`).click();
  await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

  // Then
  await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
});

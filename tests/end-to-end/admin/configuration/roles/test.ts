import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail, mockApiConfig } from '../../../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
  picsureUser,
  userTypes,
} from '../../../mock-data';
import { userIsLoggedIn } from '../../../utils';

const validationText = {
  empty: /([Pp]lease )?[Ff]ill out this field.?/,
};

test.use({ storageState: 'tests/end-to-end/.auth/superUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page);
  await mockApiSuccess(page, '*/**/psama/role', mockRoles);
  await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
  await mockApiSuccess(page, '*/**/psama/application', mockApps);
  await mockApiSuccess(page, '*/**/psama/connection', mockConnections);
});

test('Has Roles management table', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  // Then
  await expect(page.locator('#role-table .table')).toBeVisible();
});
test('Has add role button', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  // Then
  await expect(page.getByTestId('add-role')).toBeVisible();
});
test('Add role button takes user to new role page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  // When
  await page.getByTestId('add-role').click();

  // Then
  await page.waitForURL('**/admin/configuration/role/new');
  expect(page.url()).toContain('admin/configuration/role/new');
});
test('Role form has pre-populated priviledges', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');
  await userIsLoggedIn(page);
  const checkboxes = page
    .getByTestId('privilege-checkboxes')
    .getByText(mockPrivileges[0].name, { exact: true });

  // Then
  await expect(checkboxes).toBeVisible();
});
test('Role form cancel button navigates back to configuration page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/role/new');
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

  // When
  await page.locator('#role-table table tbody tr').first().click();

  // Then
  await page.waitForURL(`**/admin/configuration/role/${mockRoles[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);
});
test('Edit row icon takes user to edit role form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

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
  await userIsLoggedIn(page);

  // Then
  await expect(page.getByLabel('Name')).toHaveValue(mockRoles[0].name);
  await expect(page.getByLabel('Description')).toHaveValue(mockRoles[0].description);
  await expect(page.getByLabel(mockRoles[0].privileges[0].name)).toBeChecked();
});
test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
  const modalId = `role-${mockRoles[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  // When
  await page.getByTestId(modalId + '-btn').click();

  // Then
  await expect(page.getByTestId(modalId)).toBeVisible();
});
test('Delete gives success message', async ({ page }) => {
  const modalId = `role-${mockRoles[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
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
  await userIsLoggedIn(page);
  await mockApiFail(page, `*/**/psama/role/${mockRoles[0].uuid}`, 'failed');

  // When
  await page.getByTestId(modalId + '-btn').click();
  await page.getByTestId(modalId).getByRole('button', { name: 'Yes' }).click();

  // Then
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'error');
});

test('A top admin opening a role page in a fresh tab stays on it', async ({ page }) => {
  // Given a valid token but no user in sessionStorage, as in a newly opened tab
  await page.addInitScript(() => sessionStorage.removeItem('user'));
  await mockApiSuccess(page, '*/**/psama/user/me', { ...picsureUser, ...userTypes.superUser });
  await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: picsureUser.consents });
  await mockApiSuccess(page, `*/**/psama/role/${mockRoles[0].uuid}`, mockRoles[0]);

  // When
  await page.goto(`/admin/configuration/role/${mockRoles[0].uuid}/edit`);

  // Then
  await expect(page.getByTestId('role-form')).toBeVisible();
  await expect(page).toHaveURL(RegExp(`/admin/configuration/role/${mockRoles[0].uuid}/edit$`));
});

test.describe('Admin on Configuration page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });
  test('Access Control tab is hidden when not top admin', async ({ page }) => {
    // When
    await page.goto('/admin/configuration?tab=access-control');
    await userIsLoggedIn(page);

    // Then
    await expect(
      page.getByTestId('tabs-control').filter({ hasText: 'Access Control' }),
    ).toHaveCount(0);
    await expect(page.locator('#role-table')).toHaveCount(0);
    await expect(page.getByTestId('PlatformApiKeys-table')).toBeVisible();
  });
  for (const path of ['new', `${mockRoles[0].uuid}/edit`]) {
    test(`role/${path} redirects to the configuration page when not top admin`, async ({
      page,
    }) => {
      // When
      await page.goto(`/admin/configuration/role/${path}`);

      // Then
      await expect(page).toHaveURL(/\/admin\/configuration$/);
      await expect(page.getByTestId('role-form')).toHaveCount(0);
    });
  }
});

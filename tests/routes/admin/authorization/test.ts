import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
} from '../../../mock-data';

const validationText = {
  empty: 'Please fill out this field.',
  invalidText: 'Please match the requested format.',
  option: 'Please select an item in the list.',
};

test.describe('admin authorization page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, '*/**/psama/role', mockRoles);
    await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
    await mockApiSuccess(page, '*/**/psama/application', mockApps);
  });
  test.describe('Roles', () => {
    test('Has Roles management table', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // Then
      await expect(page.locator('#authorization-role-table .table')).toBeVisible();
    });
    test('Has add role button', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // Then
      await expect(page.getByTestId('add-role')).toBeVisible();
    });
    test('Add role button takes user to new role page', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId('add-role').click();

      // Then
      await page.waitForURL('**/admin/authorization/role/new');
      await expect(page.url()).toContain('admin/authorization/role/new');
    });
    test('Role form has pre-populated priviledges', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');
      const checkboxes = page
        .getByTestId('privilege-checkboxes')
        .getByText(mockPrivileges[0].name, { exact: true });

      // Then
      await expect(checkboxes).toBeVisible();
    });
    test('Role form cancel button navigates back to authorization page', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');

      // When
      await page.getByText('Cancel', { exact: true }).click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('Role form returns to authorization page with success message', async ({ page }) => {
      // Given
      const newRole = {
        name: 'coconut',
        description: 'walnut',
        privileges: [mockPrivileges[0]],
      };
      await mockApiSuccess(page, '*/**/psama/role', { content: [newRole] });
      await page.goto('/admin/authorization/role/new');

      // When
      await page.getByLabel('Name').fill(newRole.name);
      await page.getByLabel('Description').fill(newRole.description);
      await page.getByLabel(mockPrivileges[0].name).check();
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('Role form returns error message on api fail', async ({ page }) => {
      // Given
      await mockApiFail(page, '*/**/psama/role', 'failed');
      await page.goto('/admin/authorization/role/new');

      // When
      await page.getByLabel('Name').fill('coconut');
      await page.getByLabel('Description').fill('walnut');
      await page.getByLabel(mockPrivileges[0].name).check();
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
    test('Role form enforces required name chars', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');

      // When
      await page.getByLabel('Name').fill('<;:\';"');
      await page.getByLabel('Description').fill('walnut');
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const invalid = await page
        .getByLabel('Name')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(invalid).toContain(validationText.invalidText);
    });
    test('Role form enforces required name length', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');

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
    test('Role form enforces required description chars', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');

      // When
      await page.getByLabel('Name').fill('coconut');
      await page.getByLabel('Description').fill('<;:\';"');
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const invalid = await page
        .getByLabel('Description')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(invalid).toContain(validationText.invalidText);
    });
    test('Role form enforces required description length', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');

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
    test('View row icon takes user to view role form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId(`role-view-btn-${mockRoles[0].uuid}`).click();

      // Then
      await page.waitForURL(`**/admin/authorization/role/${mockRoles[0].uuid}`);
      await expect(page.url()).toContain(`/admin/authorization/role/${mockRoles[0].uuid}`);
    });
    test('Clicking row takes user to view role form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.locator('#authorization-role-table table tbody tr').first().click();

      // Then
      await page.waitForURL(`**/admin/authorization/role/${mockRoles[0].uuid}`);
      await expect(page.url()).toContain(`/admin/authorization/role/${mockRoles[0].uuid}`);
    });
    test('Edit row icon takes user to edit role form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId(`role-edit-btn-${mockRoles[0].uuid}`).click();

      // Then
      await page.waitForURL(`**/admin/authorization/role/${mockRoles[0].uuid}/edit`);
      await expect(page.url()).toContain(`/admin/authorization/role/${mockRoles[0].uuid}/edit`);
    });
    test('Edit role form has pre-populated values', async ({ page }) => {
      // Given
      await page.goto(`/admin/authorization/role/${mockRoles[0].uuid}/edit`);

      // Then
      await expect(page.getByLabel('Name')).toHaveValue(mockRoles[0].name);
      await expect(page.getByLabel('Description')).toHaveValue(mockRoles[0].description);
      await expect(page.getByLabel(mockRoles[0].privileges[0].name)).toBeChecked();
    });
    test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`).click();

      // Then
      await expect(page.getByTestId('modal')).toBeVisible();
    });
    test('Delete gives success message', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');
      await mockApiSuccess(page, `*/**/psama/role/${mockRoles[0].uuid}`, {});

      // When
      await page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`).click();
      await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
    });
    test('Delete gives error message on api failure', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');
      await mockApiFail(page, `*/**/psama/role/${mockRoles[0].uuid}`, 'failed');

      // When
      await page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`).click();
      await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
  });
  test.describe('Privileges', () => {
    test('Has Privileges management table', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // Then
      await expect(page.locator('#authorization-privilege-table .table')).toBeVisible();
    });
    test('Has add privilege button', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // Then
      await expect(page.getByTestId('add-privilege')).toBeVisible();
    });
    test('Add privilege button takes user to new privilege page', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId('add-privilege').click();

      // Then
      await page.waitForURL('**/admin/authorization/privilege/new');
      await expect(page.url()).toContain('admin/authorization/privilege/new');
    });
    test('Privileges form has pre-populated applications', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // Then
      await expect(page.getByLabel('Application').getByRole('option')).toHaveCount(
        mockApps.length + 1,
      );
    });
    test('Privileges form cancel button navigates back to authorization page', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByText('Cancel', { exact: true }).click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('Privileges form returns to authorization page with success message', async ({ page }) => {
      // Given
      const newPriv = {
        name: 'coconut',
        description: 'walnut',
        application: mockApps[0],
      };
      await mockApiSuccess(page, '*/**/psama/privilege', { content: [newPriv] });
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill(newPriv.name);
      await page.getByLabel('Description').fill(newPriv.description);
      await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('Privileges form returns error message on api fail', async ({ page }) => {
      // Given
      await mockApiFail(page, '*/**/psama/privilege', 'failed');
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill('coconut');
      await page.getByLabel('Description').fill('walnut');
      await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
    test('Privileges form enforces required name chars', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill('<;:\';"');
      await page.getByLabel('Description').fill('walnut');
      await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const invalid = await page
        .getByLabel('Name')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(invalid).toContain(validationText.invalidText);
    });
    test('Privileges form enforces required name length', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill('');
      await page.getByLabel('Description').fill('walnut');
      await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const empty = await page
        .getByLabel('Name')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(empty).toContain(validationText.empty);
    });
    test('Privileges form enforces required description chars', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill('coconut');
      await page.getByLabel('Description').fill('<;:\';"');
      await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const invalid = await page
        .getByLabel('Description')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(invalid).toContain(validationText.invalidText);
    });
    test('Privileges form enforces required description length', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill('coconut');
      await page.getByLabel('Description').fill('');
      await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const empty = await page
        .getByLabel('Description')
        .evaluate((element: HTMLInputElement) => element.validationMessage);
      await expect(empty).toContain(validationText.empty);
    });
    test('Privileges form enforces application selection', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      await page.getByLabel('Name').fill('coconut');
      await page.getByLabel('Description').fill('walnut');
      await page.getByRole('button', { name: 'Save' }).click();

      // Then
      const noOption = await page
        .getByLabel('Application')
        .evaluate((element: HTMLSelectElement) => element.validationMessage);
      await expect(noOption).toContain(validationText.option);
    });
    test('View row icon takes user to view privilege form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId(`privilege-view-btn-${mockPrivileges[0].uuid}`).click();

      // Then
      await page.waitForURL(`**/admin/authorization/privilege/${mockPrivileges[0].uuid}`);
      await expect(page.url()).toContain(
        `/admin/authorization/privilege/${mockPrivileges[0].uuid}`,
      );
    });
    test('Clicking row takes user to view priviledge form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.locator('#authorization-privilege-table table tbody tr').first().click();

      // Then
      await page.waitForURL(`**/admin/authorization/privilege/${mockPrivileges[0].uuid}`);
      await expect(page.url()).toContain(
        `/admin/authorization/privilege/${mockPrivileges[0].uuid}`,
      );
    });
    test('Edit row icon takes user to edit privilege form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId(`privilege-edit-btn-${mockPrivileges[0].uuid}`).click();

      // Then
      await page.waitForURL(`**/admin/authorization/privilege/${mockPrivileges[0].uuid}/edit`);
      await expect(page.url()).toContain(
        `/admin/authorization/privilege/${mockPrivileges[0].uuid}/edit`,
      );
    });
    test('Edit privilege form has pre-populated values', async ({ page }) => {
      // Given
      await page.goto(`/admin/authorization/privilege/${mockPrivileges[2].uuid}/edit`);

      // Then
      await expect(page.getByLabel('Name')).toHaveValue(mockPrivileges[2].name);
      await expect(page.getByLabel('Description')).toHaveValue(mockPrivileges[2].description);
      await expect(page.getByLabel('Application')).toHaveValue(mockApps[0].uuid);
    });
    test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      await page.getByTestId(`privilege-delete-btn-${mockPrivileges[0].uuid}`).click();

      // Then
      await expect(page.getByTestId('modal')).toBeVisible();
    });
    test('Delete gives success message', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');
      await mockApiSuccess(page, `*/**/psama/privilege/${mockPrivileges[0].uuid}`, {});

      // When
      await page.getByTestId(`privilege-delete-btn-${mockPrivileges[0].uuid}`).click();
      await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
    });
    test('Delete gives error message on api failure', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');
      await mockApiFail(page, `*/**/psama/privilege/${mockPrivileges[0].uuid}`, 'failed');

      // When
      await page.getByTestId(`privilege-delete-btn-${mockPrivileges[0].uuid}`).click();
      await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

      // Then
      await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
    });
  });
});

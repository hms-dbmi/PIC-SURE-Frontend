import { expect } from '@playwright/test';
import { test } from '../../../custom-context';

import {
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
} from '../../../../src/lib/stores/mock/data';

test.describe('admin authorization page', () => {
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
      const addButton = page.getByTestId('add-role');
      await addButton.click();

      // Then
      await page.waitForURL('**/admin/authorization/role/new');
      await expect(page.url()).toContain('admin/authorization/role/new');
    });
    test('New role form has pre-populated priviledges', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');
      const checkboxes = page
        .getByTestId('privilege-checkboxes')
        .getByText(mockPrivileges[0].name, { exact: true });

      // Then
      await expect(checkboxes).toBeVisible();
    });
    test('New role cancel button navigates back to authorization page', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/role/new');

      // When
      const cancelButton = page.getByText('Cancel', { exact: true });
      await cancelButton.click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('View row icon takes user to view role form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      const viewIcon = page.getByTestId(`role-view-btn-${mockRoles[0].uuid}`);
      await viewIcon.click();

      // Then
      await page.waitForURL(`**/admin/authorization/role/${mockRoles[0].uuid}`);
      await expect(page.url()).toContain(`/admin/authorization/role/${mockRoles[0].uuid}`);
    });
    test('Edit row icon takes user to edit role form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      const editIcon = page.getByTestId(`role-edit-btn-${mockRoles[0].uuid}`);
      await editIcon.click();

      // Then
      await page.waitForURL(`**/admin/authorization/role/${mockRoles[0].uuid}/edit`);
      await expect(page.url()).toContain(`/admin/authorization/role/${mockRoles[0].uuid}/edit`);
    });
    test('Edit role form has pre-populated values', async ({ page }) => {
      // Given
      await page.goto(`/admin/authorization/role/${mockRoles[0].uuid}/edit`);

      // Then
      await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue(mockRoles[0].name);
      await expect(page.getByRole('textbox', { name: 'description' })).toHaveValue(
        mockRoles[0].description,
      );
      await expect(page.getByRole('checkbox', { checked: true }).first()).toHaveValue(
        mockRoles[0].privileges[0].uuid,
      );
    });
    test('Edit role cancel button navigates back to authorization page', async ({ page }) => {
      // Given
      await page.goto(`/admin/authorization/role/${mockRoles[0].uuid}/edit`);

      // When
      const cancelButton = page.getByText('Cancel', { exact: true });
      await cancelButton.click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      const deleteIcon = page.getByTestId(`role-delete-btn-${mockRoles[0].uuid}`);
      await deleteIcon.click();

      // Then
      await expect(page.getByTestId('modal')).toBeVisible();
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
      const addButton = page.getByTestId('add-privilege');
      await addButton.click();

      // Then
      await page.waitForURL('**/admin/authorization/privilege/new');
      await expect(page.url()).toContain('admin/authorization/privilege/new');
    });
    test('New privilege form has pre-populated applications', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // Then
      await expect(page.getByLabel('Application:').getByRole('option')).toHaveCount(
        mockApps.length + 1,
      );
    });
    test('New privilege cancel button navigates back to authorization page', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization/privilege/new');

      // When
      const cancelButton = page.getByText('Cancel', { exact: true });
      await cancelButton.click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('View row icon takes user to view privilege form', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      const viewIcon = page.getByTestId(`privilege-view-btn-${mockPrivileges[0].uuid}`);
      await viewIcon.click();

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
      const editIcon = page.getByTestId(`privilege-edit-btn-${mockPrivileges[0].uuid}`);
      await editIcon.click();

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
      await expect(page.getByRole('textbox', { name: 'name' })).toHaveValue(mockPrivileges[2].name);
      await expect(page.getByRole('textbox', { name: 'description' })).toHaveValue(
        mockPrivileges[2].description,
      );
      await expect(page.getByLabel('Application:')).toHaveValue(mockApps[0].uuid);
    });
    test('Edit privilege cancel button navigates back to authorization page', async ({ page }) => {
      // Given
      await page.goto(`/admin/authorization/privilege/${mockPrivileges[0].uuid}/edit`);

      // When
      const cancelButton = page.getByText('Cancel', { exact: true });
      await cancelButton.click();

      // Then
      await page.waitForURL('**/admin/authorization');
      await expect(page.url()).toContain('/admin/authorization');
    });
    test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
      // Given
      await page.goto('/admin/authorization');

      // When
      const deleteIcon = page.getByTestId(`privilege-delete-btn-${mockPrivileges[0].uuid}`);
      await deleteIcon.click();

      // Then
      await expect(page.getByTestId('modal')).toBeVisible();
    });
  });
});

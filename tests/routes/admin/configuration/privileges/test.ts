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
  option: /([Pp]lease )?[Ss]elect an item in the list.?/,
};

test.use({ storageState: 'tests/.auth/superUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, '*/**/psama/role', mockRoles);
  await mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
  await mockApiSuccess(page, '*/**/psama/application', mockApps);
  await mockApiSuccess(page, '*/**/psama/connection', mockConnections);
});

test('Has Privileges management table', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // Then
  await expect(page.locator('#privilege-table .table')).toBeVisible();
});
test('Has add privilege button', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // Then
  await expect(page.getByTestId('add-privilege')).toBeVisible();
});
test('Add privilege button takes user to new privilege page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId('add-privilege').click();

  // Then
  await page.waitForURL('**/admin/configuration/privilege/new');
  expect(page.url()).toContain('admin/configuration/privilege/new');
});
test('Privileges form has pre-populated applications', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/privilege/new');

  // Then
  await expect(page.getByLabel('Application').getByRole('option')).toHaveCount(mockApps.length + 1);
});
test('Privileges form cancel button navigates back to configuration page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/privilege/new');

  // When
  await page.getByText('Cancel', { exact: true }).click();

  // Then
  await page.waitForURL('**/admin/configuration');
  expect(page.url()).toContain('/admin/configuration');
});
test('Privileges form returns to configuration page with success message', async ({ page }) => {
  // Given
  const newPriv = {
    name: 'coconut',
    description: 'walnut',
    application: mockApps[0],
  };
  await mockApiSuccess(page, '*/**/psama/privilege', [newPriv]);
  await page.goto('/admin/configuration/privilege/new');

  // When
  await page.getByLabel('Name').fill(newPriv.name);
  await page.getByLabel('Description').fill(newPriv.description);
  await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  await page.waitForURL('**/admin/configuration');
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'success');
  expect(page.url()).toContain('/admin/configuration');
});
test('Privileges form returns error message on api fail', async ({ page }) => {
  // Given
  await mockApiFail(page, '*/**/psama/privilege', 'failed');
  await page.goto('/admin/configuration/privilege/new');

  // When
  await page.getByLabel('Name').fill('coconut');
  await page.getByLabel('Description').fill('walnut');
  await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'error');
});
test('Privileges form enforces required name length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/privilege/new');

  // When
  await page.getByLabel('Name').fill('');
  await page.getByLabel('Description').fill('walnut');
  await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('Name')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Privileges form enforces required description length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/privilege/new');

  // When
  await page.getByLabel('Name').fill('coconut');
  await page.getByLabel('Description').fill('');
  await page.getByLabel('Application').selectOption({ label: mockApps[0].name });
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('Description')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Privileges form enforces application selection', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/privilege/new');

  // When
  await page.getByLabel('Name').fill('coconut');
  await page.getByLabel('Description').fill('walnut');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const noOption = await page
    .getByLabel('Application')
    .evaluate((element: HTMLSelectElement) => element.validationMessage);
  expect(noOption).toMatch(validationText.option);
});
test('Clicking row takes user to edit priviledge form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.locator('#privilege-table table tbody tr').first().click();

  // Then
  await page.waitForURL(`**/admin/configuration/privilege/${mockPrivileges[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/privilege/${mockPrivileges[0].uuid}/edit`);
});
test('Edit row icon takes user to edit privilege form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(`privilege-${mockPrivileges[0].uuid}-edit-btn`).click();

  // Then
  await page.waitForURL(`**/admin/configuration/privilege/${mockPrivileges[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/privilege/${mockPrivileges[0].uuid}/edit`);
});
test('Edit privilege form has pre-populated values', async ({ page }) => {
  // Given
  await mockApiSuccess(page, `*/**/psama/privilege/${mockPrivileges[2].uuid}`, mockPrivileges[2]);
  await page.goto(`/admin/configuration/privilege/${mockPrivileges[2].uuid}/edit`);

  // Then
  await expect(page.getByLabel('Name')).toHaveValue(mockPrivileges[2].name);
  await expect(page.getByLabel('Description')).toHaveValue(mockPrivileges[2].description);
  await expect(page.getByLabel('Application')).toHaveValue(mockApps[0].uuid);
});
test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
  const modalId = `privilege-${mockPrivileges[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(modalId + '-btn').click();

  // Then
  await expect(page.getByTestId(modalId)).toBeVisible();
});
test('Delete gives success message', async ({ page }) => {
  const modalId = `privilege-${mockPrivileges[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');
  await mockApiSuccess(page, `*/**/psama/privilege/${mockPrivileges[0].uuid}`, {});

  // When
  await page.getByTestId(modalId + '-btn').click();
  await page.getByTestId(modalId).getByRole('button', { name: 'Yes' }).click();

  // Then
  const toast = page.getByTestId('toast-root');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('data-type', 'success');
});
test('Delete gives error message on api failure', async ({ page }) => {
  const modalId = `privilege-${mockPrivileges[0].uuid}-delete`;

  // Given
  await page.goto('/admin/configuration');
  await mockApiFail(page, `*/**/psama/privilege/${mockPrivileges[0].uuid}`, 'failed');

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
    for (const privilege of mockPrivileges) {
      await expect(page.getByTestId(`privilege-${privilege.uuid}-edit-btn`)).toBeDisabled();
    }

    // Check that all delete buttons are disabled
    for (const privilege of mockPrivileges) {
      await expect(page.getByTestId(`privilege-${privilege.uuid}-delete-btn`)).toBeDisabled();
    }
    // Check that add privilege button is disabled
    await expect(page.getByTestId('add-privilege')).toHaveClass(/opacity-50 pointer-events-none/);
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
    await page.locator('#privilege-table table tbody tr').first().click();
    // Then
    await expect(page.getByTestId('privilege-form')).toBeVisible();
    await expect(page.getByTestId('privilege-form')).toHaveAttribute('disabled', '');
    await expect(page.getByTestId('privilege-save-btn')).toBeDisabled();
    await expect(page.getByTestId('privilege-cancel-btn')).not.toBeDisabled();
  });
});

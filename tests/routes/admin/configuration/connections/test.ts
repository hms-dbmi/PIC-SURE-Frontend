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

test('Has Connection management table', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // Then
  await expect(page.locator('#connection-table .table')).toBeVisible();
});
test('Has add connection button', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // Then
  await expect(page.getByTestId('add-connection')).toBeVisible();
});
test('Add connection button takes user to new connection page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId('add-connection').click();

  // Then
  await page.waitForURL('**/admin/configuration/connection/new');
  expect(page.url()).toContain('admin/configuration/connection/new');
});
test('Connection form cancel button navigates back to configuration page', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByText('Cancel', { exact: true }).click();

  // Then
  await page.waitForURL('**/admin/configuration');
  expect(page.url()).toContain('/admin/configuration');
});
test('Connection form returns to configuration page with success message', async ({ page }) => {
  // Given
  const newConenction = {
    label: 'bananas',
    id: 'chocolate',
    subprefix: 'chocolate-bananas',
    requiredFields: '["a field"]',
  };
  await page.goto('/admin/configuration/connection/new');
  await mockApiSuccess(page, '*/**/psama/connection', { message: '', content: [newConenction] });

  // When
  await page.getByLabel('Label').fill(newConenction.label);
  await page.getByLabel('ID').fill(newConenction.id);
  await page.getByLabel('Sub Prefix').fill(newConenction.subprefix);
  await page.getByLabel('Required Fields').fill(newConenction.requiredFields);
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  await page.waitForURL('**/admin/configuration');
  await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
  expect(page.url()).toContain('/admin/configuration');
});
test('Connection form returns error message on api fail', async ({ page }) => {
  // Given
  await mockApiFail(page, '*/**/psama/connection', 'failed');
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').fill('bananas');
  await page.getByLabel('ID').fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
});
test('Connection form enforces required Label min length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').fill('');
  await page.getByLabel('ID').fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('Label')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Connection form enforces required ID min length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').fill('banana');
  await page.getByLabel('ID').fill('');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('ID')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Connection form enforces required Sub Prefix min length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').fill('banana');
  await page.getByLabel('ID').fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  const empty = await page
    .getByLabel('Sub Prefix')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Connection form returns a validation error when JSON is not valid', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').fill('banana');
  await page.getByLabel('ID').fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByLabel('Required Fields').fill('?>');
  await page.getByRole('button', { name: 'Save' }).click();

  // Then
  await expect(page.getByTestId('validation-error')).toBeVisible();
});
test('Clicking row takes user to edit connection form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.locator('#connection-table table tbody tr').first().click();

  // Then
  await page.waitForURL(`**/admin/configuration/connection/${mockConnections[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);
});
test('Edit row icon takes user to edit connection form', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(`connection-edit-btn-${mockConnections[0].uuid}`).click();

  // Then
  await page.waitForURL(`**/admin/configuration/connection/${mockConnections[0].uuid}/edit`);
  expect(page.url()).toContain(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);
});
test('Edit connection form has pre-populated values', async ({ page }) => {
  const connection = mockConnections[0];

  // Given
  await page.goto(`/admin/configuration/connection/${connection.uuid}/edit`);

  // Then
  await expect(page.getByLabel('Label')).toHaveValue(connection.label);
  await expect(page.getByLabel('ID:', { exact: true })).toHaveValue(connection.id);
  await expect(page.getByLabel('Sub Prefix')).toHaveValue(connection.subPrefix);
  await expect(page.getByLabel('Required Fields')).toHaveValue(connection.requiredFields);
});
test('Delete row icon asks users to confirm or cancel', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');

  // When
  await page.getByTestId(`connection-delete-btn-${mockConnections[0].uuid}`).click();

  // Then
  await expect(page.getByTestId('modal')).toBeVisible();
});
test('Delete gives success message', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await mockApiSuccess(page, `*/**/psama/connection/${mockConnections[0].id}`, {});

  // When
  await page.getByTestId(`connection-delete-btn-${mockConnections[0].uuid}`).click();
  await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

  // Then
  await expect(page.locator('.snackbar-wrapper .variant-filled-success')).toBeVisible();
});
test('Delete gives error message on api failure', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration');
  await mockApiFail(page, `*/**/psama/connection/${mockConnections[0].id}`, 'failed');

  // When
  await page.getByTestId(`connection-delete-btn-${mockConnections[0].uuid}`).click();
  await page.getByTestId('modal').getByRole('button', { name: 'Yes' }).click();

  // Then
  await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
});

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
  await page.getByTestId('connection-cancel-btn').click();

  // Then
  await page.waitForURL('**/admin/configuration');
  expect(page.url()).toContain('/admin/configuration');
});
test('Connection form returns to configuration page with success message', async ({ page }) => {
  // Given
  const requiredField = { label: 'hot', id: 'lava' };
  const newConenction = {
    label: 'bananas',
    id: 'chocolate',
    subprefix: 'chocolate-bananas',
    requiredFields: JSON.stringify([requiredField]),
  };
  await page.goto('/admin/configuration/connection/new');
  await mockApiSuccess(page, '*/**/psama/connection', { message: '', content: [newConenction] });

  // When
  await page.getByLabel('Label').first().fill(newConenction.label);
  await page.getByLabel('ID').first().fill(newConenction.id);
  await page.getByLabel('Sub Prefix').fill(newConenction.subprefix);
  await page.getByTestId('connection-save-btn').click();

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
  await page.getByLabel('Label').first().fill('bananas');
  await page.getByLabel('ID').first().fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByTestId('connection-save-btn').click();

  // Then
  await expect(page.locator('.snackbar-wrapper .variant-filled-error')).toBeVisible();
});
test('Connection form enforces required Label min length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').first().fill('');
  await page.getByLabel('ID').first().fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByTestId('connection-save-btn').click();

  // Then
  const empty = await page
    .getByLabel('Label')
    .first()
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Connection form enforces required ID min length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').first().fill('banana');
  await page.getByLabel('ID').first().fill('');
  await page.getByLabel('Sub Prefix').fill('chocolate-bananas');
  await page.getByTestId('connection-save-btn').click();

  // Then
  const empty = await page
    .getByLabel('ID')
    .first()
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
});
test('Connection form enforces required Sub Prefix min length', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration/connection/new');

  // When
  await page.getByLabel('Label').first().fill('banana');
  await page.getByLabel('ID').first().fill('chocolate');
  await page.getByLabel('Sub Prefix').fill('');
  await page.getByTestId('connection-save-btn').click();

  // Then
  const empty = await page
    .getByLabel('Sub Prefix')
    .evaluate((element: HTMLInputElement) => element.validationMessage);
  expect(empty).toMatch(validationText.empty);
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
  const requiredField = JSON.parse(connection.requiredFields)[0];

  // Given
  await page.goto(`/admin/configuration/connection/${connection.uuid}/edit`);

  // Then
  await expect(page.getByLabel('Label').first()).toHaveValue(connection.label);
  await expect(page.getByLabel('ID:', { exact: true }).first()).toHaveValue(connection.id);
  await expect(page.getByLabel('Sub Prefix')).toHaveValue(connection.subPrefix);
  await expect(
    page.getByTestId(`required-field-row-${requiredField.id}`).getByLabel('Label'),
  ).toHaveValue(requiredField.label);
  await expect(
    page.getByTestId(`required-field-row-${requiredField.id}`).getByLabel('ID'),
  ).toHaveValue(requiredField.id);
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

test.describe('Required Fields', () => {
  const requiredField = { label: 'hot', id: 'lava' };
  // test('', async ({ page }) => {});
  test('Save button is disabled when label is empty', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration/connection/new');

    // When
    await page.getByTestId('required-field-row-new').getByLabel('Label').fill(requiredField.label);

    // Then
    await expect(
      page.getByTestId('required-field-row-new').getByTestId('required-field-save-btn'),
    ).toBeDisabled();
  });
  test('Save button is disabled when id is empty', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration/connection/new');

    // When
    await page.getByTestId('required-field-row-new').getByLabel('ID').fill(requiredField.id);

    // Then
    await expect(
      page.getByTestId('required-field-row-new').getByTestId('required-field-save-btn'),
    ).toBeDisabled();
  });
  test('Save button is enabled when label and id are filled', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration/connection/new');

    // When
    await page.getByTestId('required-field-row-new').getByLabel('Label').fill(requiredField.label);
    await page.getByTestId('required-field-row-new').getByLabel('ID').fill(requiredField.id);

    // Then
    await expect(
      page.getByTestId('required-field-row-new').getByTestId('required-field-save-btn'),
    ).not.toBeDisabled();
  });
  test('Reset button is hidden when field has not been given', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration/connection/new');

    // Then
    await expect(
      page.getByTestId('required-field-row-new').getByTestId('required-field-reset-btn'),
    ).not.toBeVisible();
  });
  test('Reset button is visible when field has been given', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration/connection/new');

    // When
    await page.getByTestId('required-field-row-new').getByLabel('Label').fill(requiredField.label);

    // Then
    await expect(
      page.getByTestId('required-field-row-new').getByTestId('required-field-reset-btn'),
    ).toBeVisible();
  });
  test('Edit cancel button is available when field has not changed', async ({ page }) => {
    const field = JSON.parse(mockConnections[0].requiredFields)[0];
    // Given
    await page.goto(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);

    // When
    await page
      .getByTestId(`required-field-row-${field.id}`)
      .getByTestId('required-field-edit-btn')
      .click();

    // Then
    await expect(page.getByTestId('required-field-cancel-btn')).toBeVisible();
  });
  test('Edit reset button is available when field has changed', async ({ page }) => {
    const oldField = JSON.parse(mockConnections[0].requiredFields)[0];

    // Given
    await page.goto(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);

    // When
    await page.getByTestId('required-field-edit-btn').click();
    await page
      .getByTestId(`required-field-row-${oldField.id}`)
      .getByLabel('Label')
      .fill(requiredField.label);

    // Then
    await expect(
      page.getByTestId(`required-field-row-${oldField.id}`).getByTestId('required-field-reset-btn'),
    ).toBeVisible();
  });
  test('New button adds empty new row', async ({ page }) => {
    // Given
    await page.goto(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);

    // When
    await page.getByTestId('required-field-new-btn').click();

    // Then
    await expect(page.getByTestId('required-field-row-new')).toBeVisible();
  });
  test('Deleting new field removes new field row', async ({ page }) => {
    // Given
    await page.goto(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);

    // When
    await page.getByTestId('required-field-new-btn').click();
    await page
      .getByTestId('required-field-row-new')
      .getByTestId('required-field-delete-btn')
      .click();
  });
  test('Deleting existing field removes field row', async ({ page }) => {
    const oldField = JSON.parse(mockConnections[0].requiredFields)[0];

    // Given
    await page.goto(`/admin/configuration/connection/${mockConnections[0].uuid}/edit`);

    // When
    await page
      .getByTestId(`required-field-row-${oldField.id}`)
      .getByTestId('required-field-delete-btn')
      .click();

    // Then
    await expect(page.getByTestId(`required-field-row-${oldField.id}`)).not.toBeVisible();
  });
  test('A notice appears when two identical id values are added', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration/connection/new');
    await page.getByTestId('required-field-row-new').getByLabel('Label').fill(requiredField.label);
    await page.getByTestId('required-field-row-new').getByLabel('ID').fill(requiredField.id);
    await page.getByTestId('required-field-row-new').getByTestId('required-field-save-btn').click();

    //When
    await page.getByTestId('required-field-new-btn').click();
    await page.getByTestId('required-field-row-new').getByLabel('Label').fill('a different label');
    await page.getByTestId('required-field-row-new').getByLabel('ID').fill(requiredField.id);
    await page.getByTestId('required-field-row-new').getByTestId('required-field-save-btn').click();

    // Then
    await expect(page.getByTestId('validation-warn')).toBeVisible();
  });
});

test.describe('Admin on Configuration page', () => {
  test.use({ storageState: 'tests/.auth/adminUser.json' });
  test('Action and add button(s) are disabled when not top admin', async ({ page }) => {
    // Given
    await page.goto('/admin/configuration');

    // Then
    // Check that all edit buttons are disabled
    for (const connection of mockConnections) {
      await expect(page.getByTestId(`connection-edit-btn-${connection.uuid}`)).toBeDisabled();
    }

    // Check that all delete buttons are disabled
    for (const connection of mockConnections) {
      await expect(page.getByTestId(`connection-delete-btn-${connection.uuid}`)).toBeDisabled();
    }
    // Check that add connection button is disabled
    await expect(page.getByTestId('add-connection')).toHaveClass(/opacity-50 pointer-events-none/);
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
    await page.locator('#connection-table table tbody tr').first().click();
    // Then
    await expect(page.getByTestId('connection-form')).toBeVisible();
    await expect(page.getByTestId('connection-form')).toHaveAttribute('disabled', '');
    await expect(page.getByTestId('required-field-new-btn')).toBeDisabled();
    await expect(page.getByTestId('connection-save-btn')).toBeDisabled();
    await expect(page.getByTestId('connection-cancel-btn')).not.toBeDisabled();
  });
});

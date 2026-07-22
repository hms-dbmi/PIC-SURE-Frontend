import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig, mockApiFail } from '../../../custom-context';
import { userIsLoggedIn } from '../../../utils';

test.use({ storageState: 'tests/end-to-end/.auth/superUser.json' });

const clickTab = (page: import('@playwright/test').Page, name: string) =>
  page.getByTestId('tabs-control').filter({ hasText: name }).click();

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page);
  await mockApiSuccess(page, '*/**/picsure/configuration?kind=ui%3AfeatureFlag', [
    { uuid: 'row-analyze-api', name: 'ANALYZE_API', kind: 'ui:featureFlag', value: 'false' },
  ]);
  await mockApiSuccess(page, '*/**/picsure/configuration?kind=ui%3Asetting', []);
  await mockApiSuccess(page, '*/**/picsure/configuration?kind=ui%3Abranding', [
    { uuid: 'row-logo-alt', name: 'LOGO_ALT', kind: 'ui:branding', value: 'Custom Alt Text' },
  ]);
});

test('Features tab lists known fields, showing API-sourced value with API origin pill', async ({
  page,
}) => {
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  await clickTab(page, 'Features');

  await expect(page.getByTestId('config-tab-features')).toBeVisible();
  await expect(page.getByTestId('config-field-row-ANALYZE_API')).toBeVisible();
  await expect(page.getByTestId('config-field-origin-ANALYZE_API')).toHaveText('API');
  await expect(page.getByTestId('config-field-input-ANALYZE_API')).not.toBeChecked();

  // A field with no API row and no env var falls back to its default origin.
  await expect(page.getByTestId('config-field-origin-DISCOVER')).toHaveText('Default');
});

test('Toggling a feature and saving sends the change and shows a success toast', async ({
  page,
}) => {
  await mockApiSuccess(page, '*/**/picsure/configuration/admin/row-analyze-api/', {
    uuid: 'row-analyze-api',
    name: 'ANALYZE_API',
    kind: 'ui:featureFlag',
    value: 'true',
  });

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Features');

  await page.getByTestId('config-field-input-ANALYZE_API').check();
  await page.getByTestId('config-field-save-ANALYZE_API').click();

  await expect(page.getByText('Saved Analyze Api')).toBeVisible();
});

test('Reset to default deletes the API row for a field', async ({ page }) => {
  await mockApiSuccess(page, '*/**/picsure/configuration/admin/row-analyze-api/', {});

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Features');

  await expect(page.getByTestId('config-field-reset-ANALYZE_API')).toBeVisible();
  await page.getByTestId('config-field-reset-ANALYZE_API').click();

  await expect(page.getByText('Reset Analyze Api to default')).toBeVisible();
  await expect(page.getByTestId('config-field-origin-ANALYZE_API')).toHaveText('Default');
});

test('A save failure keeps the edited value and shows an error toast', async ({ page }) => {
  await mockApiFail(page, '*/**/picsure/configuration/admin/row-analyze-api/', 'failed');

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Features');

  await page.getByTestId('config-field-input-ANALYZE_API').check();
  await page.getByTestId('config-field-save-ANALYZE_API').click();

  await expect(page.getByText('Failed to save Analyze Api')).toBeVisible();
  await expect(page.getByTestId('config-field-input-ANALYZE_API')).toBeChecked();
});

test('An invalid integer value disables Save and shows an inline error', async ({ page }) => {
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Settings');

  await expect(page.getByTestId('config-tab-settings')).toBeVisible();
  const input = page.getByTestId('config-field-input-MAX_DATA_POINTS_FOR_EXPORT');
  await input.fill('not-a-number');

  await expect(page.getByTestId('config-field-error-MAX_DATA_POINTS_FOR_EXPORT')).toBeVisible();
  await expect(page.getByTestId('config-field-save-MAX_DATA_POINTS_FOR_EXPORT')).toBeDisabled();
});

test('Branding tab only shows the two API/env-configurable fields plus a scope note', async ({
  page,
}) => {
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Branding');

  await expect(page.getByTestId('config-branding-scope-note')).toBeVisible();
  await expect(page.getByTestId('config-field-row-LOGO_ALT')).toBeVisible();
  await expect(page.getByTestId('config-field-row-LOGO')).toBeVisible();
  const brandingTab = page.getByTestId('config-tab-branding');
  await expect(brandingTab.getByTestId(/^config-field-row-/)).toHaveCount(2);
});

test.describe('Admin on Configuration page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  test('Non-top-admin users see the new tabs disabled', async ({ page }) => {
    await page.goto('/admin/configuration');
    await userIsLoggedIn(page);
    await clickTab(page, 'Features');

    await expect(page.getByTestId('config-field-input-ANALYZE_API')).toBeDisabled();
    await expect(page.getByTestId('config-field-save-ANALYZE_API')).toBeDisabled();
  });
});

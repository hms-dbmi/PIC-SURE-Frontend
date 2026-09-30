import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig, mockApiFail } from '../../../custom-context';
import { userIsLoggedIn } from '../../../utils';
import { configurationPath } from '../../../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/superUser.json' });

const clickTab = (page: import('@playwright/test').Page, name: string) =>
  page.getByTestId('tabs-control').filter({ hasText: name }).click();

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page);
  await mockApiSuccess(page, `${configurationPath}?kind=ui%3AfeatureFlag`, [
    { uuid: 'row-analyze-api', name: 'ANALYZE_API', kind: 'ui:featureFlag', value: 'false' },
  ]);
  await mockApiSuccess(page, `${configurationPath}?kind=ui%3Asetting`, []);
  await mockApiSuccess(page, `${configurationPath}?kind=ui%3Abranding`, [
    { uuid: 'row-logo-alt', name: 'LOGO_ALT', kind: 'ui:branding', value: 'Custom Alt Text' },
  ]);
});

test('Settings & Features tab lists known fields, showing API-sourced value with API origin pill', async ({
  page,
}) => {
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  await clickTab(page, 'Settings & Features');

  await expect(page.getByTestId('config-tab-features-settings')).toBeVisible();
  await expect(page.getByTestId('config-field-row-ANALYZE_API')).toBeVisible();
  await expect(page.getByTestId('config-field-origin-ANALYZE_API')).toHaveText('API');
  await expect(page.getByTestId('config-field-input-ANALYZE_API')).not.toBeChecked();

  // A field with no API row and no env var falls back to its default origin.
  await expect(page.getByTestId('config-field-origin-DISCOVER')).toHaveText('Default');

  // A feature and a setting sharing a relation land in the same section (e.g. Export).
  await expect(page.getByTestId('config-field-row-MAX_DATA_POINTS_FOR_EXPORT')).toBeVisible();
});

test('Toggling a feature and saving sends the change and shows a success toast', async ({
  page,
}) => {
  await mockApiSuccess(page, `${configurationPath}/admin/row-analyze-api`, {
    uuid: 'row-analyze-api',
    name: 'ANALYZE_API',
    kind: 'ui:featureFlag',
    value: 'true',
  });

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Settings & Features');

  // The boolean control is a styled track/thumb toggle: the real checkbox is visually
  // hidden behind it, so click the visible toggle rather than checking the input
  // directly (which real browsers resolve via label semantics, but Playwright's own
  // actionability check on the input itself does not).
  await page.getByTestId('config-field-toggle-ANALYZE_API').click();
  await page.getByTestId('config-field-save-ANALYZE_API').click();

  await expect(page.getByText('Saved Analyze Api')).toBeVisible();
});

test('Reset to default deletes the API row for a field', async ({ page }) => {
  await mockApiSuccess(page, `${configurationPath}/admin/row-analyze-api`, {});

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Settings & Features');

  await expect(page.getByTestId('config-field-reset-ANALYZE_API')).toBeVisible();
  await page.getByTestId('config-field-reset-ANALYZE_API').click();

  await expect(page.getByText('Reset Analyze Api to default')).toBeVisible();
  await expect(page.getByTestId('config-field-origin-ANALYZE_API')).toHaveText('Default');
});

test('A save failure keeps the edited value and shows an error toast', async ({ page }) => {
  await mockApiFail(page, `${configurationPath}/admin/row-analyze-api`, 'failed');

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Settings & Features');

  await page.getByTestId('config-field-toggle-ANALYZE_API').click();
  await page.getByTestId('config-field-save-ANALYZE_API').click();

  await expect(page.getByText('Failed to save Analyze Api')).toBeVisible();
  await expect(page.getByTestId('config-field-input-ANALYZE_API')).toBeChecked();
});

test('An invalid integer value disables Save and shows an inline error', async ({ page }) => {
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Settings & Features');

  await expect(page.getByTestId('config-tab-features-settings')).toBeVisible();
  const input = page.getByTestId('config-field-input-MAX_DATA_POINTS_FOR_EXPORT');
  await input.fill('not-a-number');

  await expect(page.getByTestId('config-field-error-MAX_DATA_POINTS_FOR_EXPORT')).toBeVisible();
  await expect(page.getByTestId('config-field-save-MAX_DATA_POINTS_FOR_EXPORT')).toBeDisabled();
});

test('Branding tab only shows the API/env-configurable fields plus a scope note', async ({
  page,
}) => {
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Branding');

  await expect(page.getByTestId('config-branding-scope-note')).toBeVisible();
  await expect(page.getByTestId('config-field-row-LOGO_ALT')).toBeVisible();
  await expect(page.getByTestId('config-field-row-LOGO')).toBeVisible();
  await expect(page.getByTestId('config-field-row-DOTS_COLORS_CLASS')).toBeVisible();
  const brandingTab = page.getByTestId('config-tab-branding');
  await expect(brandingTab.getByTestId(/^config-field-row-/)).toHaveCount(4);
});

test('Deprecated API rows are listed separately and can be deleted', async ({ page }) => {
  await mockApiSuccess(page, `${configurationPath}?kind=ui%3AfeatureFlag`, [
    { uuid: 'row-analyze-api', name: 'ANALYZE_API', kind: 'ui:featureFlag', value: 'false' },
    { uuid: 'row-old-flag', name: 'REMOVED_OLD_FLAG', kind: 'ui:featureFlag', value: 'true' },
  ]);
  await mockApiSuccess(page, `${configurationPath}/admin/row-old-flag`, {});

  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);
  await clickTab(page, 'Settings & Features');

  await expect(page.getByTestId('config-deprecated-features-settings')).toBeVisible();
  await expect(page.getByTestId('config-deprecated-row-REMOVED_OLD_FLAG')).toBeVisible();
  // Still-registered fields never show up in the deprecated table.
  await expect(page.getByTestId('config-deprecated-row-ANALYZE_API')).toHaveCount(0);

  await page.getByTestId('config-deprecated-delete-REMOVED_OLD_FLAG').click();

  await expect(page.getByText('Deleted REMOVED_OLD_FLAG')).toBeVisible();
  await expect(page.getByTestId('config-deprecated-row-REMOVED_OLD_FLAG')).toHaveCount(0);
  await expect(page.getByTestId('config-deprecated-features-settings')).toHaveCount(0);
});

test('A ?tab= link opens that tab, and switching tabs updates it', async ({ page }) => {
  // When
  await page.goto('/admin/configuration?tab=branding');
  await userIsLoggedIn(page);

  // Then
  await expect(page.getByTestId('config-tab-branding')).toBeVisible();

  // When
  await clickTab(page, 'Settings & Features');

  // Then
  await expect(page.getByTestId('config-tab-features-settings')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/configuration\?tab=settings$/);
});

test('The Configuration nav link returns to the default tab', async ({ page }) => {
  // Given
  await page.goto('/admin/configuration?tab=branding');
  await userIsLoggedIn(page);
  await expect(page.getByTestId('config-tab-branding')).toBeVisible();

  // When
  await page.locator('#nav-link-admin-configuration').click();

  // Then
  await expect(page.locator('#role-table')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/configuration\?tab=access-control$/);
});

test('Top admins land on Access Control and see no read-only notice', async ({ page }) => {
  // When
  await page.goto('/admin/configuration');
  await userIsLoggedIn(page);

  // Then
  await expect(page.locator('#role-table')).toBeVisible();

  // When
  await clickTab(page, 'Branding');

  // Then
  await expect(page.getByTestId('config-tab-branding')).toBeVisible();
  await expect(page.getByTestId('top-admin-only-error')).toHaveCount(0);
});

test.describe('Admin on Configuration page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  test('Read-only notice shows only on the tabs admins cannot fully edit', async ({ page }) => {
    // Given
    await page.route('**/picsure/operations/banners', (route) => route.fulfill({ json: [] }));
    await page.goto('/admin/configuration');
    await userIsLoggedIn(page);

    // When / Then: each step checks the tab's own content, so a click that does nothing fails
    const tabs = [
      { name: 'Site banners', content: page.getByRole('button', { name: '+ Create banner' }) },
      { name: 'Settings & Features', content: page.getByTestId('config-tab-features-settings') },
      { name: 'Branding', content: page.getByTestId('config-tab-branding') },
      { name: 'API Keys', content: page.getByTestId('PlatformApiKeys-table') },
    ];
    for (const { name, content } of tabs) {
      await clickTab(page, name);
      await expect(content).toBeVisible();
      if (name === 'Site banners') {
        await expect(page.getByTestId('top-admin-only-error')).toHaveCount(0);
      } else {
        // Inside the open tab, like every other notice on the page.
        await expect(page.getByRole('tabpanel').getByTestId('top-admin-only-error')).toBeVisible();
        await expect(page.getByTestId('top-admin-only-error')).toHaveCount(1);
      }
    }
  });

  test('Non-top-admin users see the new tabs disabled', async ({ page }) => {
    await page.goto('/admin/configuration');
    await userIsLoggedIn(page);
    await clickTab(page, 'Settings & Features');

    await expect(page.getByTestId('config-field-input-ANALYZE_API')).toBeDisabled();
    // Save only ever renders once a field is dirty; a disabled field can't become dirty.
    await expect(page.getByTestId('config-field-save-ANALYZE_API')).toHaveCount(0);
  });
});

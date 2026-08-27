import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';

const banner = {
  uuid: '11111111-1111-1111-1111-111111111111',
  htmlContent: '<p>Scheduled maintenance</p>',
  title: 'Maintenance',
  appearance: 'WARNING',
  icon: 'WARNING',
  dismissible: true,
  audience: 'EVERYONE',
  placement: 'SITE_TOP',
  pageTargets: [{ kind: 'ALL' }],
  priority: 10,
  presentationHash: 'abc123',
};

test.describe('Site banner delivery', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
  });

  test('renders above navigation and refreshes after client navigation', async ({ page }) => {
    let feedRequests = 0;
    await page.route('**/picsure/operations/banners/active', async (route) => {
      feedRequests += 1;
      await route.fulfill({ json: [banner] });
    });

    await page.goto('/');

    const bannerRegion = page.getByTestId('site-banner-region');
    await expect(bannerRegion).toBeVisible();
    await expect(page.getByRole('region', { name: 'Maintenance' })).toContainText(
      'Scheduled maintenance',
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const bannerElement = document.querySelector('[data-testid="site-banner-region"]');
          const navigationElement = document.querySelector('#page-navigation');
          return Boolean(
            bannerElement &&
            navigationElement &&
            bannerElement.compareDocumentPosition(navigationElement) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          );
        }),
      )
      .toBe(true);

    await page.locator('#nav-link-help').click();
    await expect(page).toHaveURL('/help');
    await expect.poll(() => feedRequests).toBeGreaterThanOrEqual(2);
    await expect(bannerRegion).toBeVisible();
  });
});

test.describe('Site banner workflow 1', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    for (const path of ['role', 'privilege', 'application', 'connection']) {
      await page.route(`**/psama/${path}`, (route) => route.fulfill({ json: [] }));
    }
    await page.route('**/picsure/operations/banners/active', (route) =>
      route.fulfill({ json: [] }),
    );
  });

  test('keeps sentence spaces, Enter, and a second paragraph while editing', async ({ page }) => {
    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const bannerForm = page.getByTestId('banner-editor-form');
    const editor = bannerForm.locator('#banner-content-editor .ql-editor');

    await editor.fill('First sentence with spaces');
    await editor.press('End');
    await editor.press('Enter');
    await editor.type('Second  paragraph');

    await expect(editor.locator('p')).toHaveCount(2);
    expect((await editor.locator('p').nth(0).textContent())?.replaceAll('\u00a0', ' ')).toBe(
      'First sentence with spaces',
    );
    expect((await editor.locator('p').nth(1).textContent())?.replaceAll('\u00a0', ' ')).toBe(
      'Second  paragraph',
    );
    const previewContent = page
      .getByRole('region', { name: 'Site announcement' })
      .locator('.site-banner-content');
    await expect(previewContent.locator('p')).toHaveCount(2);
    expect(
      (await previewContent.locator('p').nth(1).textContent())?.replaceAll('\u00a0', ' '),
    ).toBe('Second  paragraph');
  });

  test('creates, previews, publishes, and renders the authoritative banner above navigation', async ({
    page,
  }) => {
    let published = false;
    let publicationRequests = 0;
    let submitted: Record<string, unknown> | undefined;
    const authoritativeBanner = {
      ...banner,
      uuid: '99999999-9999-9999-9999-999999999999',
      htmlContent:
        '<p><strong>Server-confirmed window</strong> <a href="https://example.org/status" rel="noopener noreferrer" target="_blank">View status</a></p>',
      title: 'Published maintenance notice',
      appearance: 'ERROR',
      icon: 'ERROR',
      dismissible: false,
      priority: 42,
      presentationHash: 'server-computed-hash',
      status: 'PUBLISHED',
      startAt: '2026-08-27T12:00:00Z',
      endAt: null,
      createdAt: '2026-08-27T12:00:00Z',
      createdBy: 'admin-id',
      updatedAt: '2026-08-27T12:00:00Z',
      updatedBy: 'admin-id',
      publishedAt: '2026-08-27T12:00:00Z',
      publishedBy: 'admin-id',
    };
    await page.route('**/picsure/operations/banners/active', (route) =>
      route.fulfill({ json: published ? [authoritativeBanner] : [] }),
    );
    await page.route('**/picsure/operations/banners', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      publicationRequests += 1;
      submitted = route.request().postDataJSON();
      published = true;
      await route.fulfill({ status: 201, json: authoritativeBanner });
    });

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const bannerForm = page.getByTestId('banner-editor-form');
    const editor = bannerForm.locator('#banner-content-editor .ql-editor');
    await expect(editor).toHaveAttribute('aria-label', 'Banner content');
    await editor.fill('System maintenance status page');
    await editor.press('ControlOrMeta+a');
    await page.getByRole('button', { name: 'link' }).click();
    await page.locator('.ql-tooltip input[data-link]').fill('https://example.org/status');
    await page.locator('.ql-tooltip input[data-link]').press('Enter');
    await page.getByRole('radio', { name: 'Warning' }).check();
    await page.getByText('Advanced options').click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Planned maintenance');
    await page.getByRole('combobox', { name: 'Icon' }).selectOption('WARNING');

    const preview = page.getByRole('region', { name: 'Planned maintenance' });
    await expect(preview).toHaveClass(/preset-tonal-warning/);
    await expect(
      preview.getByRole('link', { name: 'System maintenance status page' }),
    ).toBeVisible();
    await expect(preview.locator('img')).toHaveCount(0);

    await page.getByRole('button', { name: 'Publish now' }).click();

    await expect(page).toHaveURL(/\/admin\/configuration$/);
    await expect(page.getByTestId('toast-root')).toHaveAttribute('data-type', 'success');
    await expect(editor).toContainText('Server-confirmed window View status');
    const reconciledPreview = page.getByRole('region', {
      name: 'Published maintenance notice',
    });
    await expect(reconciledPreview).toHaveClass(/preset-tonal-error/);
    await expect(reconciledPreview).toContainText('Server-confirmed window View status');
    await expect(reconciledPreview.getByRole('button', { name: /Dismiss/ })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Published maintenance notice',
    );
    await expect(page.getByRole('combobox', { name: 'Icon' })).toHaveValue('ERROR');
    await expect(page.getByRole('radio', { name: 'Permanent' })).toBeChecked();
    await expect(bannerForm.getByRole('status')).toContainText('Published maintenance notice');
    await expect(page.getByRole('button', { name: 'Published' })).toBeDisabled();
    expect(publicationRequests).toBe(1);

    await page.getByRole('button', { name: 'Create another banner' }).click();
    await expect(bannerForm.getByRole('status')).toHaveCount(0);
    await expect(editor).toHaveText('');
    await expect(page.getByRole('radio', { name: 'Primary' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Dismissible' })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    await expect(page.getByRole('combobox', { name: 'Icon' })).toHaveValue('NONE');
    await expect(page.getByRole('button', { name: 'Publish now' })).toBeDisabled();
    expect(publicationRequests).toBe(1);

    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Published maintenance notice' })).toContainText(
      'Server-confirmed window View status',
    );
    expect(submitted).toMatchObject({
      htmlContent:
        '<p><a href="https://example.org/status" rel="noopener noreferrer" target="_blank">System\u00a0maintenance\u00a0status\u00a0page</a></p>',
      title: 'Planned maintenance',
      appearance: 'WARNING',
      icon: 'WARNING',
      dismissible: true,
      audience: 'EVERYONE',
      placement: 'SITE_TOP',
      pageTargets: [{ kind: 'ALL' }],
    });
  });

  test('keeps editor state and shows a stable error when publication fails', async ({ page }) => {
    await page.route('**/picsure/operations/banners', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await route.fulfill({ status: 503, json: { error: 'internal details must not be shown' } });
    });

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const bannerForm = page.getByTestId('banner-editor-form');
    const editor = bannerForm.locator('#banner-content-editor .ql-editor');
    await editor.fill('Preserve this announcement');
    await page.getByText('Advanced options').click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Preserve this title');

    await page.getByRole('button', { name: 'Publish now' }).click();

    await expect(page).toHaveURL(/\/admin\/configuration$/);
    const toast = page.getByTestId('toast-root');
    await expect(toast).toHaveAttribute('data-type', 'error');
    await expect(toast).toContainText('Banner could not be published');
    await expect(toast).toContainText(
      'The banner was not published. Check your connection and try again.',
    );
    await expect(toast).not.toContainText('internal details');
    await expect(editor).toContainText('Preserve this announcement');
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Preserve this title');
  });
});

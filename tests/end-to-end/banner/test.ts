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
    await page.route('**/picsure/operations/banners', (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: [] });
      return route.fallback();
    });
  });

  test('loads management on tab selection and protects dirty configuration-tab changes', async ({
    page,
  }) => {
    let accessControlLoads = 0;
    let managementLoads = 0;
    await page.route('**/psama/role', (route) => {
      accessControlLoads += 1;
      return route.fulfill({ json: [] });
    });
    await page.route('**/picsure/operations/banners', (route) => {
      if (route.request().method() === 'GET') {
        managementLoads += 1;
        return route.fulfill({ json: [] });
      }
      return route.fallback();
    });

    await page.goto('/admin/configuration');
    await expect.poll(() => accessControlLoads).toBeGreaterThan(0);
    expect(managementLoads).toBe(0);
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await expect.poll(() => managementLoads).toBe(1);
    await page.getByRole('button', { name: '+ Create banner' }).click();
    await page
      .getByTestId('banner-editor-form')
      .locator('#banner-content-editor .ql-editor')
      .fill('Unsaved configuration-tab content');

    await page.getByRole('tab', { name: 'Branding' }).click();

    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await expect(page.getByTestId('banner-editor-form')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByTestId('banner-editor-form')).toBeVisible();

    await page.getByRole('tab', { name: 'Branding' }).click();
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await expect(page.getByRole('dialog')).not.toContainText('open Branding');
    await page.getByRole('button', { name: 'Keep editing' }).click();

    await page.getByRole('link', { name: 'Help' }).click();
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/configuration$/);
    await page.getByRole('button', { name: 'Keep editing' }).click();

    await page.getByRole('tab', { name: 'Branding' }).click();
    await page.getByRole('button', { name: 'Discard changes' }).click();
    await expect(page.getByTestId('banner-editor-form')).not.toBeVisible();
    await expect(page.getByTestId('config-tab-branding')).toBeVisible();
    await expect(page.getByTestId('config-branding-scope-note')).toContainText('Limited scope');
    await expect(page.getByTestId('config-tab-branding').getByText('LOGO_ALT')).toBeVisible();
  });

  test('keeps sentence spaces, Enter, and a second paragraph while editing', async ({ page }) => {
    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('button', { name: '+ Create banner' }).click();
    const bannerForm = page.getByTestId('banner-editor-form');
    const editor = bannerForm.locator('#banner-content-editor .ql-editor');

    await editor.fill('First sentence with spaces');
    await editor.press('End');
    await editor.press('Enter');
    await editor.type('  Second  paragraph');

    await expect(editor.locator('p')).toHaveCount(2);
    expect((await editor.locator('p').nth(0).textContent())?.replaceAll('\u00a0', ' ')).toBe(
      'First sentence with spaces',
    );
    expect((await editor.locator('p').nth(1).textContent())?.replaceAll('\u00a0', ' ')).toBe(
      '  Second  paragraph',
    );
    const previewContent = page
      .getByRole('region', { name: 'Site announcement' })
      .locator('.site-banner-content');
    await expect(previewContent.locator('p')).toHaveCount(2);
    expect(await previewContent.locator('p').nth(1).textContent()).toBe('  Second  paragraph');
    expect(await previewContent.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe(
      'pre-wrap',
    );
  });

  test('keeps a bullet list stable while adding items', async ({ page }) => {
    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('button', { name: '+ Create banner' }).click();
    const bannerForm = page.getByTestId('banner-editor-form');
    const editor = bannerForm.locator('#banner-content-editor .ql-editor');

    await editor.click();
    await bannerForm.locator('button.ql-list[value="bullet"]').click();
    await editor.type('First item');
    await editor.press('Enter');
    const firstItem = editor.locator('li').nth(0);
    await firstItem.evaluate((element) => {
      (element as HTMLElement & { reconciliationSentinel?: boolean }).reconciliationSentinel = true;
    });
    await editor.type('Second item');

    await expect(editor.locator('li')).toHaveCount(2);
    await expect(firstItem).toHaveText('First item');
    expect(
      await firstItem.evaluate(
        (element) =>
          (element as HTMLElement & { reconciliationSentinel?: boolean }).reconciliationSentinel,
      ),
    ).toBe(true);
    await expect(editor.locator('li').nth(1)).toHaveText('Second item');
    const previewList = page
      .getByRole('region', { name: 'Site announcement' })
      .locator('.site-banner-content ul');
    await expect(previewList.locator('li')).toHaveCount(2);
    await expect(previewList.locator('li').nth(0)).toHaveText('First item');
    await expect(previewList.locator('li').nth(1)).toHaveText('Second item');
  });

  test('creates, saves, reopens, updates, and publishes the authoritative banner', async ({
    page,
  }) => {
    let published = false;
    let publicationRequests = 0;
    let updateRequests = 0;
    let submitted: Record<string, unknown> | undefined;
    let managedRecords: Record<string, unknown>[] = [];
    let updateSubmitted: Record<string, unknown> | undefined;
    const savedBanner = {
      ...banner,
      uuid: '99999999-9999-9999-9999-999999999999',
      htmlContent: '<p>Server-confirmed saved draft</p>',
      title: 'Saved maintenance draft',
      appearance: 'WARNING',
      icon: 'WARNING',
      dismissible: true,
      priority: null,
      presentationHash: 'server-saved-hash',
      status: 'SAVED',
      lifecycle: 'SAVED',
      startAt: null,
      endAt: null,
      createdAt: '2026-08-27T11:00:00Z',
      createdBy: 'admin-id',
      updatedAt: '2026-08-27T11:00:00Z',
      updatedBy: 'admin-id',
      publishedAt: null,
      publishedBy: null,
    };
    const authoritativeBanner = {
      ...banner,
      uuid: savedBanner.uuid,
      htmlContent:
        '<p><strong>Server-confirmed window</strong> <a href="https://example.org/status" rel="noopener noreferrer" target="_blank">View status</a></p>',
      title: 'Published maintenance notice',
      appearance: 'ERROR',
      icon: 'ERROR',
      dismissible: false,
      priority: 42,
      presentationHash: 'server-computed-hash',
      status: 'PUBLISHED',
      lifecycle: 'ACTIVE',
      startAt: '2026-08-27T12:00:00Z',
      endAt: null,
      createdAt: '2026-08-27T12:00:00Z',
      createdBy: 'admin-id',
      updatedAt: '2026-08-27T12:00:00Z',
      updatedBy: 'admin-id',
      publishedAt: '2026-08-27T12:00:00Z',
      publishedBy: 'admin-id',
    };
    const correctedBanner = {
      ...authoritativeBanner,
      htmlContent: '<p><strong>Corrected visitor notice</strong></p>',
      title: 'Corrected maintenance notice',
      appearance: 'SECONDARY',
      presentationHash: 'server-computed-corrected-hash',
      updatedAt: '2026-08-27T13:00:00Z',
      updatedBy: 'second-admin-id',
    };
    let activeBanner = authoritativeBanner;
    await page.route('**/picsure/operations/banners/active', (route) =>
      route.fulfill({ json: published ? [activeBanner] : [] }),
    );
    await page.route('**/picsure/operations/banners**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === 'GET' && url.pathname.endsWith('/banners')) {
        return route.fulfill({ json: managedRecords });
      }
      if (method === 'POST' && url.pathname.endsWith('/banners/saved')) {
        managedRecords = [savedBanner];
        return route.fulfill({ status: 201, json: savedBanner });
      }
      if (method === 'PUT' && url.pathname.endsWith(`/banners/${savedBanner.uuid}`)) {
        const update = route.request().postDataJSON();
        if (published) {
          updateRequests += 1;
          updateSubmitted = update;
          activeBanner = correctedBanner;
          managedRecords = [correctedBanner];
          return route.fulfill({ json: correctedBanner });
        }
        const updatedBanner = {
          ...savedBanner,
          ...update,
          updatedAt: '2026-08-27T11:30:00Z',
          updatedBy: 'editor-id',
          presentationHash: 'updated-saved-hash',
        };
        managedRecords = [updatedBanner];
        return route.fulfill({ json: updatedBanner });
      }
      if (method === 'POST' && url.pathname.endsWith(`/banners/${savedBanner.uuid}/publish`)) {
        publicationRequests += 1;
        submitted = route.request().postDataJSON();
        published = true;
        managedRecords = [authoritativeBanner];
        return route.fulfill({ json: authoritativeBanner });
      }
      return route.fallback();
    });

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('button', { name: '+ Create banner' }).click();
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

    await page.getByRole('button', { name: 'Save for later' }).click();

    await expect(page).toHaveURL(/\/admin\/configuration$/);
    await expect(page.getByTestId('toast-root')).toHaveAttribute('data-type', 'success');
    const savedRow = page.locator(`[data-banner-row="${savedBanner.uuid}"]`);
    await expect(savedRow).toBeVisible();
    await expect(savedRow).toContainText('Server-confirmed saved draft');
    await expect(savedRow).toContainText('Saved');
    await savedRow.evaluate((element) => element.setAttribute('data-stability-sentinel', 'same'));
    const details = savedRow.getByRole('button', { name: 'Details' });
    await expect(details).toHaveAttribute('aria-expanded', 'false');
    await expect(details).toHaveAttribute('aria-controls', `banner-${savedBanner.uuid}-details`);
    await details.focus();
    await expect(details).toBeFocused();
    await details.press('Enter');
    await expect(details).toBeFocused();
    await expect(savedRow).toHaveAttribute('data-stability-sentinel', 'same');
    await expect(savedRow).toBeVisible();
    await expect(savedRow).toContainText('Audience: Everyone');
    await expect(savedRow).toContainText('Last changed by admin-id');
    await expect(savedRow.getByRole('region')).toHaveCount(0);

    await savedRow.getByRole('button', { name: 'Edit banner' }).click();
    await expect(page.getByRole('heading', { name: 'Edit saved banner' })).toBeVisible();
    const reopenedEditor = page.getByRole('textbox', { name: 'Banner content' });
    await expect(reopenedEditor).toContainText('Server-confirmed saved draft');
    await page.getByText('Advanced options').click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Updated reusable draft');
    await page.getByRole('button', { name: 'Save changes' }).click();

    const updatedRow = page.locator(`[data-banner-row="${savedBanner.uuid}"]`);
    await expect(updatedRow).toContainText('Server-confirmed saved draft');
    await updatedRow.getByRole('button', { name: 'Details' }).click();
    await expect(updatedRow).toContainText('Last changed by editor-id');
    await updatedRow.getByRole('button', { name: 'Edit banner' }).click();
    await page.getByText('Advanced options').click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Publish this draft');

    await page.getByRole('link', { name: 'Help' }).click();
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/configuration$/);
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Publish this draft');

    await page.getByRole('button', { name: 'Publish now' }).click();

    const publishedRow = page.locator(`[data-banner-row="${savedBanner.uuid}"]`);
    await expect(publishedRow).toBeVisible();
    await expect(publishedRow).toContainText('Server-confirmed window View status');
    await expect(publishedRow).toContainText('Active');

    await publishedRow.getByRole('button', { name: 'Details' }).click();
    await publishedRow.getByRole('button', { name: 'Edit banner' }).click();
    await expect(page.getByRole('heading', { name: 'Edit published banner' })).toBeVisible();
    const publishedEditor = page.getByRole('textbox', { name: 'Banner content' });
    await publishedEditor.fill('Corrected visitor notice');
    const correctedEditorHtml = await publishedEditor.innerHTML();
    await page.getByRole('radio', { name: 'Secondary' }).check();
    await page.getByText('Advanced options').click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Correction submitted by admin');
    await page.getByRole('button', { name: 'Save changes' }).click();

    const correctedRow = page.locator(`[data-banner-row="${savedBanner.uuid}"]`);
    await expect(correctedRow).toContainText('Corrected visitor notice');
    await expect(page.getByText(/version history/i)).toHaveCount(0);
    await expect(
      page.getByRole('button', {
        name: /version|history|revisions?|restore|revert|rollback/i,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', {
        name: /version|history|revisions?|restore|revert|rollback/i,
      }),
    ).toHaveCount(0);
    expect(updateRequests).toBe(1);
    expect(publicationRequests).toBe(1);

    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Corrected maintenance notice' })).toContainText(
      'Corrected visitor notice',
    );
    expect(submitted).toMatchObject({
      htmlContent: '<p>Server-confirmed saved draft</p>',
      title: 'Publish this draft',
      appearance: 'WARNING',
      icon: 'WARNING',
      dismissible: true,
      audience: 'EVERYONE',
      placement: 'SITE_TOP',
      pageTargets: [{ kind: 'ALL' }],
    });
    expect(updateSubmitted).toMatchObject({
      htmlContent: correctedEditorHtml,
      title: 'Correction submitted by admin',
      appearance: 'SECONDARY',
      icon: 'ERROR',
      dismissible: false,
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
    await page.getByRole('button', { name: '+ Create banner' }).click();
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

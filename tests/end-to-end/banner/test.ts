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
    await page.route('**/picsure/operations/banners/active/v2', async (route) => {
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

test.describe('Site banner closed-login delivery', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'false' }] });
  });

  test('shows signed-out audiences after redirecting outside the normal shell', async ({
    page,
  }) => {
    const signedIn = { ...banner, title: 'Signed-in notice', audience: 'SIGNED_IN' };
    const signedOut = {
      ...banner,
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Signed-out notice',
      audience: 'SIGNED_OUT',
    };
    await page.route('**/picsure/operations/banners/active/v2', (route) =>
      route.fulfill({ json: [banner, signedIn, signedOut] }),
    );

    await page.goto('/');

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('region', { name: 'Maintenance' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Signed-out notice' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Signed-in notice' })).toHaveCount(0);
    await expect(page.getByTestId('site-banner-region')).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const bannerRegion = document.querySelector('[data-testid="site-banner-region"]');
          const loginTitle = document.querySelector('[data-testid="login-title"]');
          return Boolean(
            bannerRegion &&
            loginTitle &&
            bannerRegion.compareDocumentPosition(loginTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
          );
        }),
      )
      .toBe(true);

    await page.goto('/login/error');

    await expect(page.getByRole('region', { name: 'Maintenance' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Signed-out notice' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Signed-in notice' })).toHaveCount(0);
    await expect(page.getByTestId('site-banner-region')).toHaveCount(1);
  });

  test('keeps login controls reachable below multiple signed-out banners', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const notices = Array.from({ length: 4 }, (_, index) => ({
      ...banner,
      uuid: `${index + 1}0000000-0000-0000-0000-000000000000`,
      htmlContent: `<p>${'Read this important deployment notice before continuing. '.repeat(60)}</p>`,
      title: `Signed-out notice ${index + 1}`,
      dismissible: false,
      audience: 'SIGNED_OUT',
      priority: (index + 1) * 10,
      presentationHash: `signed-out-${index + 1}`,
    }));
    await page.route('**/picsure/operations/banners/active/v2', (route) =>
      route.fulfill({ json: notices }),
    );

    await page.goto('/');

    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('site-banner')).toHaveCount(4);
    const loginControl = page.getByRole('button', { name: 'Login with Auth0' });
    await expect(loginControl).not.toBeInViewport();

    await page.mouse.move(640, 360);
    await page.mouse.wheel(0, 10_000);

    await expect(loginControl).toBeInViewport({ ratio: 1 });
  });
});

// Workflow 3 of the five representative end-to-end workflows. Ticket 08 extends this same test with
// page targeting rather than adding a sixth workflow.
test.describe('Site banner workflow 3', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  const everyone = {
    ...banner,
    uuid: '77777777-7777-7777-7777-777777777777',
    htmlContent: '<p>Open to every visitor</p>',
    title: 'For everyone',
    audience: 'EVERYONE',
    priority: 10,
    presentationHash: 'server-everyone-hash',
  };
  const targeted = {
    ...banner,
    uuid: '88888888-8888-8888-8888-888888888888',
    htmlContent: '<p>Saved query limits are changing</p>',
    title: 'Release notice',
    audience: 'EVERYONE',
    priority: 20,
    presentationHash: 'server-everyone-targeted-hash',
  };
  const managementFields = {
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
  // The server recomputes the hash because audience is material: ticket 09 uses it to make a
  // dismissed occurrence eligible to reappear.
  const retargeted = {
    ...targeted,
    audience: 'SIGNED_IN',
    pageTargets: [{ kind: 'EXACT', path: '/help' }],
    presentationHash: 'server-signed-in-hash',
  };

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    for (const path of ['role', 'privilege', 'application', 'connection']) {
      await page.route(`**/psama/${path}`, (route) => route.fulfill({ json: [] }));
    }
  });

  test('retargets a published banner and filters the visitor feed by session', async ({ page }) => {
    let feed = [everyone, targeted];
    let managed = [
      { ...everyone, ...managementFields },
      { ...targeted, ...managementFields },
    ];
    let submitted: Record<string, unknown> | undefined;
    let credentialedFeedRequests = 0;
    const servedAudiences: string[][] = [];
    await page.route('**/picsure/operations/banners/active/v2', (route) => {
      if (route.request().headers()['authorization']) credentialedFeedRequests += 1;
      servedAudiences.push(feed.map((record) => record.audience));
      return route.fulfill({ json: feed });
    });
    await page.route('**/picsure/operations/banners**', (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === 'GET' && url.pathname.endsWith('/banners')) {
        return route.fulfill({ json: managed });
      }
      if (method === 'PUT' && url.pathname.endsWith(`/banners/${targeted.uuid}`)) {
        submitted = route.request().postDataJSON();
        feed = [everyone, retargeted];
        managed = [
          { ...everyone, ...managementFields },
          { ...retargeted, ...managementFields },
        ];
        return route.fulfill({ json: { ...retargeted, ...managementFields } });
      }
      return route.fallback();
    });

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const row = page.locator(`[data-banner-row="${targeted.uuid}"]`);
    await row.getByRole('button', { name: 'Details' }).click();
    await expect(row).toContainText('Audience: Everyone');

    await row.getByRole('button', { name: 'Edit banner' }).click();
    await expect(page.getByRole('radio', { name: 'Everyone' })).toBeChecked();
    await page.getByRole('radio', { name: 'Signed-in users' }).check();
    await page.getByText('Advanced options', { exact: true }).click();
    await page.getByRole('radio', { name: 'Specific pages' }).check();
    await page.getByRole('button', { name: 'Add page target' }).click();
    await page.getByRole('textbox', { name: 'Target 1 path' }).fill('/help');
    await page.getByRole('button', { name: 'Save changes' }).click();

    const retargetedRow = page.locator(`[data-banner-row="${targeted.uuid}"]`);
    await retargetedRow.getByRole('button', { name: 'Details' }).click();
    await expect(retargetedRow).toContainText('Audience: Signed-in users');
    expect(submitted).toMatchObject({
      audience: 'SIGNED_IN',
      pageTargets: [{ kind: 'EXACT', path: '/help' }],
    });

    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Release notice' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'For everyone' })).toBeVisible();

    await page.locator('#nav-link-help').click();
    await expect(page).toHaveURL('/help');
    await expect(page.getByRole('region', { name: 'Release notice' })).toContainText(
      'Saved query limits are changing',
    );
    await expect(page.getByRole('region', { name: 'For everyone' })).toBeVisible();

    // A signed-out visitor who never enters the authorized shell. The tab-scoped `user` blob
    // deliberately stays behind: only the session token decides audience.
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('/help');

    await expect(page.getByRole('region', { name: 'For everyone' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Release notice' })).toHaveCount(0);
    // The signed-out browser was still served the signed-in record over an uncredentialed
    // read: audience is presentation, not authorization.
    expect(servedAudiences.at(-1)).toContain('SIGNED_IN');
    expect(credentialedFeedRequests).toBe(0);

    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('region', { name: 'For everyone' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Release notice' })).toHaveCount(0);
  });
});

// Workflow 4 of the five representative end-to-end workflows.
test.describe('Site banner workflow 4', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  const dismissalBanner = {
    ...banner,
    uuid: '66666666-6666-6666-6666-666666666666',
    htmlContent: '<p>Dismiss this maintenance notice</p>',
    title: 'Dismissible maintenance',
    presentationHash: 'dismissal-hash-v1',
  };
  const managementFields = {
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    startAt: '2026-08-28T12:00:00Z',
    endAt: null,
    createdAt: '2026-08-28T12:00:00Z',
    createdBy: 'admin-id',
    updatedAt: '2026-08-28T12:00:00Z',
    updatedBy: 'admin-id',
    publishedAt: '2026-08-28T12:00:00Z',
    publishedBy: 'admin-id',
    disabledAt: null,
    disabledBy: null,
  };

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    for (const path of ['role', 'privilege', 'application', 'connection']) {
      await page.route(`**/psama/${path}`, (route) => route.fulfill({ json: [] }));
    }
  });

  test('dismisses for the tab session and shows the occurrence after a material edit', async ({
    page,
  }) => {
    let active = dismissalBanner;
    let managed = { ...dismissalBanner, ...managementFields };
    let submitted: Record<string, unknown> | undefined;
    let feedRequests = 0;
    await page.route('**/picsure/operations/banners/active/v2', (route) => {
      feedRequests += 1;
      return route.fulfill({ json: [active] });
    });
    await page.route('**/picsure/operations/banners**', (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === 'GET' && url.pathname.endsWith('/banners')) {
        return route.fulfill({ json: [managed] });
      }
      if (method === 'PUT' && url.pathname.endsWith(`/banners/${dismissalBanner.uuid}`)) {
        submitted = route.request().postDataJSON();
        active = {
          ...dismissalBanner,
          htmlContent: '<p>Updated maintenance notice</p>',
          title: 'Updated dismissible maintenance',
          presentationHash: 'dismissal-hash-v2',
        };
        managed = {
          ...active,
          ...managementFields,
          updatedAt: '2026-08-28T13:00:00Z',
          updatedBy: 'second-admin-id',
        };
        return route.fulfill({ json: managed });
      }
      return route.fallback();
    });

    await page.goto('/');
    const notice = page.getByRole('region', { name: 'Dismissible maintenance' });
    await expect(notice).toBeVisible();
    const dismiss = notice.getByRole('button', { name: 'Dismiss Dismissible maintenance' });
    await expect(dismiss).toHaveAttribute('title', 'Dismiss Dismissible maintenance');
    expect(await dismiss.boundingBox()).toMatchObject({ width: 44, height: 44 });
    await dismiss.focus();
    await expect(dismiss).toBeFocused();
    await dismiss.press('Enter');

    await expect(notice).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem('site-banner-dismissals-v1'))).toBe(
      `{"${dismissalBanner.uuid}":"${dismissalBanner.presentationHash}"}`,
    );

    await page.locator('#nav-link-help').click();
    await expect(page).toHaveURL('/help');
    await expect.poll(() => feedRequests).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('region', { name: 'Dismissible maintenance' })).toHaveCount(0);

    const requestsBeforeReload = feedRequests;
    await page.reload();
    await expect.poll(() => feedRequests).toBeGreaterThan(requestsBeforeReload);
    await expect(page.getByRole('region', { name: 'Dismissible maintenance' })).toHaveCount(0);

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const row = page.locator(`[data-banner-row="${dismissalBanner.uuid}"]`);
    await row.getByRole('button', { name: 'Details' }).click();
    await row.getByRole('button', { name: 'Edit banner' }).click();
    await page
      .getByTestId('banner-editor-form')
      .locator('#banner-content-editor .ql-editor')
      .fill('Updated maintenance notice');
    await page.getByRole('button', { name: 'Save changes' }).click();
    expect(submitted).toMatchObject({ htmlContent: '<p>Updated maintenance notice</p>' });

    await page.goto('/');
    await expect(
      page.getByRole('region', { name: 'Updated dismissible maintenance' }),
    ).toContainText('Updated maintenance notice');
    expect(await page.evaluate(() => sessionStorage.getItem('site-banner-dismissals-v1'))).toBe(
      `{"${dismissalBanner.uuid}":"${dismissalBanner.presentationHash}"}`,
    );
  });
});

test.describe('Site banner workflow 1', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    for (const path of ['role', 'privilege', 'application', 'connection']) {
      await page.route(`**/psama/${path}`, (route) => route.fulfill({ json: [] }));
    }
    await page.route('**/picsure/operations/banners/active/v2', (route) =>
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
    let disableRequests = 0;
    let archiveRequests = 0;
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
      disabledAt: null,
      disabledBy: null,
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
      disabledAt: null,
      disabledBy: null,
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
    const disabledBanner = {
      ...correctedBanner,
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      updatedAt: '2026-08-27T14:00:00Z',
      updatedBy: 'super-id',
      disabledAt: '2026-08-27T14:00:00Z',
      disabledBy: 'super-id',
    };
    let activeBanner = authoritativeBanner;
    await page.route('**/picsure/operations/banners/active/v2', (route) =>
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
      if (method === 'POST' && url.pathname.endsWith(`/banners/${savedBanner.uuid}/disable`)) {
        disableRequests += 1;
        published = false;
        managedRecords = [disabledBanner];
        return route.fulfill({ json: disabledBanner });
      }
      if (method === 'POST' && url.pathname.endsWith(`/banners/${savedBanner.uuid}/archive`)) {
        archiveRequests += 1;
        published = false;
        managedRecords = [];
        return route.fulfill({
          json: {
            uuid: savedBanner.uuid,
            status: 'ARCHIVED',
            archivedAt: '2026-08-27T15:00:00Z',
            archivedBy: 'super-id',
          },
        });
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

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const rowToDisable = page.locator(`[data-banner-row="${savedBanner.uuid}"]`);
    await rowToDisable.getByRole('button', { name: 'Details' }).click();
    await rowToDisable.getByRole('button', { name: 'Disable banner' }).click();

    const confirmation = page.getByRole('dialog');
    await expect(confirmation.getByRole('heading', { name: 'Disable banner?' })).toBeVisible();
    await expect(confirmation.getByRole('textbox')).toHaveCount(0);
    await confirmation.getByRole('button', { name: 'Yes' }).click();

    await expect(page.getByTestId('toast-root')).toHaveAttribute('data-type', 'success');
    await expect(page.getByRole('tab', { name: /Active & scheduled/ })).toContainText('0');
    await page.getByRole('tab', { name: /Saved & disabled/ }).click();
    await expect(page.locator(`[data-banner-row="${savedBanner.uuid}"]`)).toContainText('Disabled');
    expect(disableRequests).toBe(1);

    await page.goto('/');
    await expect(page.getByTestId('site-banner-region')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Corrected maintenance notice' })).toHaveCount(0);

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('tab', { name: /Saved & disabled/ }).click();
    const rowToArchive = page.locator(`[data-banner-row="${savedBanner.uuid}"]`);
    await rowToArchive.getByRole('button', { name: 'Details' }).click();
    await rowToArchive.getByRole('button', { name: 'Archive banner' }).click();

    const archiveConfirmation = page.getByRole('dialog');
    await expect(
      archiveConfirmation.getByRole('heading', { name: 'Archive banner?' }),
    ).toBeVisible();
    await expect(archiveConfirmation.getByRole('textbox')).toHaveCount(0);
    await expect(archiveConfirmation).toContainText('leaves normal management');
    await expect(archiveConfirmation).toContainText('retained');
    await archiveConfirmation.getByRole('button', { name: 'Yes' }).click();

    await expect(page.getByTestId('toast-root')).toHaveAttribute('data-type', 'success');
    await expect(page.locator(`[data-banner-row="${savedBanner.uuid}"]`)).toHaveCount(0);
    await expect(page.getByRole('tab', { name: /Saved & disabled/ })).toContainText('0');
    await expect(page.getByText('No banners in this section.')).toBeVisible();
    expect(archiveRequests).toBe(1);

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    for (const tab of [/Active & scheduled/, /Saved & disabled/, /Expired/]) {
      await page.getByRole('tab', { name: tab }).click();
      await expect(page.locator(`[data-banner-row="${savedBanner.uuid}"]`)).toHaveCount(0);
    }

    await page.goto('/');
    await expect(page.getByTestId('site-banner-region')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Corrected maintenance notice' })).toHaveCount(0);
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

test.describe('Site banner workflow 2', () => {
  test.use({
    storageState: 'tests/end-to-end/.auth/adminUser.json',
    timezoneId: 'America/New_York',
  });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    for (const path of ['role', 'privilege', 'application', 'connection']) {
      await page.route(`**/psama/${path}`, (route) => route.fulfill({ json: [] }));
    }
  });

  test('moves a scheduled banner through Scheduled, Active, and Expired without waiting', async ({
    page,
  }) => {
    const initialStartAt = '2026-08-28T13:01:00.000Z';
    const initialEndAt = '2026-08-28T13:02:00.000Z';
    const rescheduledStartAt = '2026-08-28T13:03:00.000Z';
    const rescheduledEndAt = '2026-08-28T13:04:00.000Z';
    let startAt = initialStartAt;
    let endAt: string | null = initialEndAt;
    let serverNow = '2026-08-28T13:00:00.000Z';
    let scheduled: Record<string, unknown> | null = null;
    let restored: Record<string, unknown> | null = null;
    let sourceLookupRequests = 0;
    await page.clock.install({ time: new Date(serverNow) });

    const lifecycle = () => {
      if (serverNow < startAt) return 'SCHEDULED';
      if (endAt && serverNow >= endAt) return 'EXPIRED';
      return 'ACTIVE';
    };
    const authoritative = () => (scheduled ? { ...scheduled, lifecycle: lifecycle() } : null);

    await page.route('**/picsure/operations/banners/active/v2', (route) => {
      if (restored) return route.fulfill({ json: [restored] });
      const banner = authoritative();
      return route.fulfill({ json: banner && lifecycle() === 'ACTIVE' ? [banner] : [] });
    });
    await page.route('**/picsure/operations/banners**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (route.request().method() === 'GET' && pathname.endsWith('/banners')) {
        const managed = restored ?? authoritative();
        return route.fulfill({ json: managed ? [managed] : [] });
      }
      if (route.request().method() === 'POST' && pathname.endsWith('/banners')) {
        const submitted = route.request().postDataJSON();
        expect(submitted).toMatchObject({ startAt: initialStartAt, endAt: initialEndAt });
        scheduled = {
          ...banner,
          ...submitted,
          uuid: '88888888-8888-8888-8888-888888888888',
          status: 'PUBLISHED',
          lifecycle: 'SCHEDULED',
          priority: 1,
          presentationHash: 'scheduled-hash',
          startAt,
          endAt,
          createdAt: serverNow,
          createdBy: 'admin-id',
          updatedAt: serverNow,
          updatedBy: 'admin-id',
          publishedAt: serverNow,
          publishedBy: 'admin-id',
          disabledAt: null,
          disabledBy: null,
        };
        return route.fulfill({ status: 201, json: scheduled });
      }
      if (
        route.request().method() === 'PUT' &&
        pathname.endsWith('/banners/88888888-8888-8888-8888-888888888888')
      ) {
        const submitted = route.request().postDataJSON();
        expect(submitted).toMatchObject({
          startAt: rescheduledStartAt,
          endAt: rescheduledEndAt,
        });
        startAt = submitted.startAt;
        endAt = submitted.endAt;
        scheduled = {
          ...scheduled,
          ...submitted,
          uuid: '88888888-8888-8888-8888-888888888888',
          lifecycle: 'SCHEDULED',
          updatedAt: serverNow,
          updatedBy: 'admin-id',
        };
        return route.fulfill({ json: scheduled });
      }
      if (
        route.request().method() === 'POST' &&
        pathname.endsWith('/banners/88888888-8888-8888-8888-888888888888/restore')
      ) {
        const submitted = route.request().postDataJSON();
        expect(submitted).toMatchObject({ startAt: null, endAt: null });
        restored = {
          ...scheduled,
          ...submitted,
          uuid: '99999999-9999-9999-9999-999999999999',
          status: 'PUBLISHED',
          lifecycle: 'ACTIVE',
          priority: 1,
          presentationHash: 'restored-hash',
          startAt: serverNow,
          endAt: null,
          createdAt: serverNow,
          createdBy: 'admin-id',
          updatedAt: serverNow,
          updatedBy: 'admin-id',
          publishedAt: serverNow,
          publishedBy: 'admin-id',
          disabledAt: null,
          disabledBy: null,
          restoredFromUuid: '88888888-8888-8888-8888-888888888888',
        };
        return route.fulfill({ status: 201, json: restored });
      }
      if (
        route.request().method() === 'GET' &&
        pathname.includes('88888888-8888-8888-8888-888888888888')
      ) {
        sourceLookupRequests += 1;
      }
      return route.fallback();
    });

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('button', { name: '+ Create banner' }).click();
    const form = page.getByTestId('banner-editor-form');
    await form.locator('#banner-content-editor .ql-editor').fill('Minute-boundary maintenance');
    await form.getByLabel('Start').fill('2026-08-28T09:01');
    await form.getByLabel('End').fill('2026-08-28T09:02');
    await expect(form.getByText('Resolved UTC: 2026-08-28 13:01 UTC')).toBeVisible();
    await expect(form.getByText('Resolved UTC: 2026-08-28 13:02 UTC')).toBeVisible();
    await form.getByRole('button', { name: 'Schedule banner' }).click();

    const row = page.locator('[data-banner-row="88888888-8888-8888-8888-888888888888"]');
    await expect(row).toContainText('Scheduled');

    serverNow = startAt;
    await page.clock.setFixedTime(new Date(serverNow));
    await page.goto('/help');
    await expect(page.getByTestId('site-banner')).toContainText('Minute-boundary maintenance');
    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await expect(row).toContainText('Active');

    await row.getByRole('button', { name: /Details/ }).click();
    await row.getByRole('button', { name: 'Edit banner' }).click();
    const publishedForm = page.getByTestId('banner-editor-form');
    await publishedForm.getByLabel('Start').fill('2026-08-28T09:03');
    await publishedForm.getByLabel('End').fill('2026-08-28T09:04');
    await expect(publishedForm.getByText('Resolved UTC: 2026-08-28 13:03 UTC')).toBeVisible();
    await publishedForm.getByRole('button', { name: 'Save changes' }).click();
    await expect(row).toContainText('Scheduled');
    await expect(row).toHaveAttribute('data-banner-row', '88888888-8888-8888-8888-888888888888');

    serverNow = rescheduledStartAt;
    await page.clock.setFixedTime(new Date(serverNow));
    await page.goto('/help');
    await expect(page.getByTestId('site-banner')).toContainText('Minute-boundary maintenance');
    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();

    serverNow = rescheduledEndAt;
    await page.clock.setFixedTime(new Date(serverNow));
    await page.reload();
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('tab', { name: 'Expired' }).click();
    await expect(row).toContainText('Expired');
    await page.goto('/help');
    await expect(page.getByTestId('site-banner')).toHaveCount(0);

    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await page.getByRole('tab', { name: 'Expired' }).click();
    await row.getByRole('button', { name: 'Details' }).click();
    await row.getByRole('button', { name: 'Restore banner' }).click();
    const restoreForm = page.getByTestId('banner-editor-form');
    await expect(page.getByRole('heading', { name: 'Restore banner' })).toBeVisible();
    await expect(restoreForm.getByLabel('Start')).toHaveValue('');
    await expect(restoreForm.getByLabel('End')).toHaveValue('');
    await expect(restoreForm.getByRole('button', { name: 'Save for later' })).toHaveCount(0);
    await restoreForm.locator('#banner-content-editor .ql-editor').fill('Restored maintenance');
    await restoreForm.getByRole('button', { name: 'Bring back now' }).click();

    const restoredRow = page.locator('[data-banner-row="99999999-9999-9999-9999-999999999999"]');
    await expect(restoredRow).toContainText('Active');
    await expect(restoredRow.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(restoredRow).toContainText('Restored from 88888888-8888-8888-8888-888888888888');
    await expect(row).toHaveCount(0);
    expect(sourceLookupRequests).toBe(0);
    await page.goto('/help');
    await expect(page.getByTestId('site-banner')).toContainText('Restored maintenance');
  });
});

test.describe('Site banner workflow 5', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    for (const path of ['role', 'privilege', 'application', 'connection']) {
      await page.route(`**/psama/${path}`, (route) => route.fulfill({ json: [] }));
    }
  });

  test('reorders with pointer and keyboard, saves, and renders visitors in saved order', async ({
    page,
  }) => {
    const managed = ['First notice', 'Second notice', 'Third notice', 'Departing notice'].map(
      (title, index) => ({
        ...banner,
        uuid: `${index + 1}1111111-1111-1111-1111-111111111111`,
        htmlContent: `<p>${title}</p>`,
        title,
        status: 'PUBLISHED',
        lifecycle: 'ACTIVE',
        priority: (index + 1) * 10,
        startAt: '2026-08-27T12:00:00Z',
        endAt: null,
        createdAt: '2026-08-27T11:00:00Z',
        createdBy: 'admin-id',
        updatedAt: '2026-08-27T12:00:00Z',
        updatedBy: 'admin-id',
        publishedAt: '2026-08-27T12:00:00Z',
        publishedBy: 'admin-id',
      }),
    );
    const arrival = {
      ...managed[3],
      uuid: '51111111-1111-1111-1111-111111111111',
      htmlContent: '<p>Concurrent arrival</p>',
      title: 'Concurrent arrival',
    };
    let saved = [...managed];
    let reorderRequests = 0;
    const reorderPayloads: string[][] = [];

    async function pointerReorder(sourceName: string, targetName: string) {
      const source = page.getByRole('button', { name: `Reorder banner: ${sourceName}` });
      const target = page.getByRole('button', { name: `Reorder banner: ${targetName}` });
      await source.scrollIntoViewIfNeeded();
      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();
      expect(sourceBox).not.toBeNull();
      expect(targetBox).not.toBeNull();
      await page.mouse.move(
        sourceBox!.x + sourceBox!.width / 2,
        sourceBox!.y + sourceBox!.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBox!.x + targetBox!.width / 2,
        targetBox!.y + targetBox!.height / 2,
        {
          steps: 10,
        },
      );
      await expect(page.getByTestId('banner-drop-preview')).toBeVisible();
      await expect(page.locator('[data-banner-row]').first()).not.toContainText(sourceName);
      await page.mouse.up();
    }

    await page.route('**/picsure/operations/banners**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (request.method() === 'GET' && pathname.endsWith('/banners/active/v2')) {
        return route.fulfill({
          json: saved.map((record) => ({
            uuid: record.uuid,
            htmlContent: record.htmlContent,
            title: record.title,
            appearance: record.appearance,
            icon: record.icon,
            dismissible: record.dismissible,
            audience: record.audience,
            placement: record.placement,
            pageTargets: record.pageTargets,
            priority: record.priority,
            presentationHash: record.presentationHash,
          })),
        });
      }
      if (request.method() === 'GET' && pathname.endsWith('/banners')) {
        return route.fulfill({ json: saved });
      }
      if (request.method() === 'PUT' && pathname.endsWith('/banners/order')) {
        reorderRequests += 1;
        const { bannerUuids } = request.postDataJSON() as { bannerUuids: string[] };
        reorderPayloads.push(bannerUuids);
        const current = reorderRequests === 1 ? [...managed.slice(0, 3), arrival] : saved;
        const currentByUuid = new Map(current.map((record) => [record.uuid, record]));
        const canonicalUuids = [
          ...bannerUuids.filter((uuid) => currentByUuid.has(uuid)),
          ...current
            .filter((record) => !bannerUuids.includes(record.uuid))
            .map((record) => record.uuid),
        ];
        saved = canonicalUuids.map((uuid, index) => ({
          ...currentByUuid.get(uuid)!,
          priority: index + 1,
        }));
        return route.fulfill({ json: saved });
      }
      return route.fallback();
    });

    await page.setViewportSize({ width: 1280, height: 2_000 });
    await page.goto('/admin/configuration');
    await page.getByRole('tab', { name: 'Site banners' }).click();
    const rows = page.locator('[data-banner-row]');
    await expect(rows).toHaveCount(4);
    await expect(page.getByTestId('banner-overlap-warning')).toContainText('4');

    await pointerReorder('First notice', 'Third notice');
    await expect(rows.nth(0)).toContainText('Second notice');
    expect(reorderRequests).toBe(0);

    await page.getByRole('tab', { name: 'Access Control' }).click();
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep ordering' }).click();
    await expect(rows.nth(0)).toContainText('Second notice');
    await page.getByRole('tab', { name: 'Access Control' }).click();
    await page.getByRole('button', { name: 'Discard order changes' }).click();
    await expect(page.getByRole('heading', { name: 'Roles Management' })).toBeVisible();

    await page.getByRole('tab', { name: 'Site banners' }).click();
    await expect(rows.nth(0)).toContainText('First notice');
    await pointerReorder('First notice', 'Third notice');

    await page.getByRole('button', { name: 'Save order' }).click();
    await expect(page.getByTestId('toast-root')).toContainText('Banner order saved');
    expect(reorderRequests).toBe(1);
    expect(reorderPayloads[0]).toHaveLength(4);
    await expect(rows).toHaveCount(4);
    await expect(rows.filter({ hasText: 'Departing notice' })).toHaveCount(0);
    await expect(rows.filter({ hasText: 'Concurrent arrival' })).toHaveCount(1);
    await expect(page.getByTestId('banner-overlap-warning')).toContainText('4');

    await page.getByRole('tab', { name: 'Access Control' }).click();
    await page.getByRole('tab', { name: 'Site banners' }).click();
    await expect(rows).toHaveCount(4);
    await page.getByRole('button', { name: /Reorder banner: Third notice/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('banner-drop-preview')).toBeVisible();
    for (let step = 0; step < 30; step += 1) await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(rows.nth(0)).toContainText('Third notice');
    expect(reorderRequests).toBe(1);

    await page.getByRole('button', { name: 'Save order' }).click();
    await expect.poll(() => reorderRequests).toBe(2);
    expect(reorderPayloads[1]).toHaveLength(4);

    await page.goto('/help');
    await expect(page.getByTestId('site-banner')).toHaveCount(4);
    await expect
      .poll(() =>
        page
          .getByTestId('site-banner')
          .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label'))),
      )
      .toEqual(['Third notice', 'Second notice', 'First notice', 'Concurrent arrival']);
  });
});

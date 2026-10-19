import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import { mockToken, picsureUser } from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';

const { QUERY, NAMED_DATASET, API_ACCESS, ADMIN, SUPER } = PicsurePrivileges;

/**
 * Opens the app the way a new tab does: the token is in localStorage, but the profile, which each
 * tab keeps in sessionStorage, isn't there yet. PSAMA answers with `privileges`. Returns the
 * profile requests the page sends.
 */
async function freshTab(page: Page, privileges: string[]): Promise<string[]> {
  await page.addInitScript((token) => localStorage.setItem('token', token), mockToken);
  const user = { ...picsureUser, privileges };
  await mockApiSuccess(page, '*/**/psama/user/me', user);
  await mockApiSuccess(page, '*/**/psama/user/me?hasToken', user);
  await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: user.consents });
  const profileRequests: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.endsWith('/psama/user/me')) profileRequests.push(pathname);
  });
  return profileRequests;
}

test.describe('A fresh tab', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test('opens a deep link to /dataset once the profile has loaded', async ({ page }) => {
    await mockApiConfig(page);
    await mockApiSuccess(page, '*/**/picsure/operations/dataset/named', []);
    const profileRequests = await freshTab(page, [QUERY, NAMED_DATASET]);

    await page.goto('/dataset');

    await userIsLoggedIn(page);
    await expect(page).toHaveURL('/dataset');
    await expect(page.locator('#app-nav-link-dataset')).toHaveAttribute('aria-current', 'page');
    expect(profileRequests).toHaveLength(1);
  });

  test('sends no PSAMA request when the pointer moves over the nav links', async ({ page }) => {
    await mockApiConfig(page);
    await freshTab(page, [QUERY, NAMED_DATASET, ADMIN]);
    await page.goto('/help');
    await userIsLoggedIn(page);
    await page.waitForLoadState('networkidle');

    const psamaRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.includes('/psama/')) psamaRequests.push(url.pathname);
    });
    const links = page.locator('#app-nav a');
    await expect(links.filter({ hasText: 'Manage Users' })).toBeVisible();
    for (const link of await links.all()) await link.hover();
    await page.waitForLoadState('networkidle');

    expect(psamaRequests).toEqual([]);
  });

  // The admin pages are nested in the ones that need query access (D3), so an admin without it
  // can't open them and isn't shown them. The sitemap's admin section also needs ADMIN, as the
  // default configuration.json says.
  const privilegeSets = [
    { name: 'a general user', privileges: [QUERY, NAMED_DATASET, API_ACCESS], nav: 0, sitemap: 0 },
    { name: 'an admin', privileges: [QUERY, ADMIN], nav: 1, sitemap: 1 },
    { name: 'a super admin', privileges: [QUERY, SUPER], nav: 1, sitemap: 0 },
    {
      name: 'an admin without query access',
      privileges: [ADMIN, NAMED_DATASET],
      nav: 0,
      sitemap: 0,
    },
    { name: 'a super admin without query access', privileges: [SUPER], nav: 0, sitemap: 0 },
  ];
  for (const { name, privileges, nav, sitemap: inSitemap } of privilegeSets) {
    test(`shows the admin links only to admins with query access: ${name}`, async ({ page }) => {
      await mockApiConfig(page);
      await freshTab(page, privileges);

      await page.goto('/help');
      await userIsLoggedIn(page);

      for (const path of ['admin-configuration', 'admin-users']) {
        await expect(page.locator(`#app-nav-link-${path}`)).toHaveCount(nav);
      }
      const sitemap = page.locator('#app-footer-sitemap');
      await expect(sitemap.getByText('Administration', { exact: true })).toHaveCount(inSitemap);
      await expect(sitemap.getByRole('link', { name: 'Manage Users' })).toHaveCount(inSitemap);
    });
  }

  test('an admin without query access is turned away from the admin pages', async ({ page }) => {
    await mockApiConfig(page);
    await freshTab(page, [ADMIN]);

    await page.goto('/admin/users');

    await expect(page).toHaveURL(/^[^?]*\/\?reason=no_privilege&from=%2Fadmin%2Fusers$/);
  });
});

test.describe('A closed deployment', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test('returns a deep link to a signed-in page after login', async ({ page, browserName }) => {
    // Same limitation as the login redirect tests in login.test.ts.
    test.skip(
      browserName !== 'chromium',
      'Login callback simulation is chromium-only, see setup.ts',
    );
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'false' }] });
    await mockApiSuccess(page, '*/**/picsure/operations/dataset/named', []);
    const user = { ...picsureUser, privileges: [QUERY, NAMED_DATASET] };
    await mockApiSuccess(page, '*/**/psama/authentication', user);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', user);
    await mockApiSuccess(page, '*/**/psama/user/me', user);
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', user);
    await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: user.consents });

    await page.goto('/dataset?tab=mine');
    await expect(page).toHaveURL(`/login?redirectTo=${encodeURIComponent('/dataset?tab=mine')}`);

    // Logging in records the destination before leaving for the IdP; seed it the same way.
    await page.addInitScript(() => {
      sessionStorage.setItem('redirect', '/dataset?tab=mine');
      sessionStorage.setItem('type', 'AUTH0');
    });
    await page
      .goto(
        '/login/loading/#access_token=' +
          mockToken +
          '&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G',
      )
      .catch(() => {});

    await page.waitForURL('/dataset?tab=mine');
    await userIsLoggedIn(page);
    await expect(page.locator('#app-nav-link-dataset')).toHaveAttribute('aria-current', 'page');
  });
});

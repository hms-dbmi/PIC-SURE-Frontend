import { expect } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import { picsureUser } from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';

// Every role x route combination is covered by src/lib/shell/Navigation.svelte.test.ts; these
// check the real app wires the signed-in user and current page into the bar.

test.describe('Public Routes Navigation', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test('Marks the current page before login', async ({ page }) => {
    // OPEN lets unauthenticated users past the root redirect-to-login guard
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });

    await page.goto('/help');

    await expect(page.locator('#app-nav-link-help')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#app-nav-link-api')).not.toHaveAttribute('aria-current');
    await expect(page.locator('#app-nav-link-dataset')).toHaveCount(0);
  });
});

test.describe('Any logged in user', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.beforeEach(async ({ page }) => {
    // Given
    // OPEN is required so that after logout, '/' shows the inline login avatar
    // instead of the root layout hard-redirecting to /login.
    await mockApiConfig(page, {
      features: [{ name: 'OPEN', value: 'true' }],
    });
    await mockApiSuccess(page, '*/**/psama/logout', {});
    await page.goto('/');
    await userIsLoggedIn(page);
  });

  test('Session avatar should reflect correct user initial after login', async ({ page }) => {
    // Then
    await expect(page.locator('#app-nav-user')).toContainText(
      (picsureUser as { email: string }).email.charAt(0).toUpperCase(),
    );
  });
  test('Session avatar should not have user initial after logout', async ({ page }) => {
    // When
    await page.locator('#app-nav-user button').first().click();
    await expect(page.locator('#app-nav-logout')).toBeVisible();

    const logoutButton = page.locator('#app-nav-logout');
    await logoutButton.click();
    await page.waitForURL(/\/login/);

    await page.goto('/');

    // Then
    await expect(page.locator('#app-nav-user')).toContainText('Login');
  });
  test('Clicking logout redirects to login page', async ({ page }) => {
    // When
    const popoutButton = page.locator('#app-nav-user button').first();
    await popoutButton.click();

    const logoutButton = page.locator('#app-nav-logout');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.waitForURL('/login');

    // Then
    await expect(page).toHaveURL('/login');
  });
});

const roleLandings = [
  { userType: 'generalUser', path: '/explorer', hidden: '#app-nav-link-admin-users' },
  { userType: 'adminUser', path: '/admin/users', hidden: undefined },
  { userType: 'superUser', path: '/admin/configuration', hidden: undefined },
];

roleLandings.forEach(({ userType, path, hidden }) => {
  test.describe(`${userType} Navigation`, () => {
    test.use({ storageState: `tests/end-to-end/.auth/${userType}.json` });

    test(`Marks ${path} as the current page after login`, async ({ page }) => {
      await mockApiConfig(page);
      await mockApiSuccess(page, '*/**/psama/user', []);
      // /explorer loads its facets as soon as it hydrates.
      await mockApiSuccess(page, '*/**/picsure/dictionary/facets', []);

      await page.goto(path);
      await userIsLoggedIn(page);

      const navItem = page.locator(`#app-nav-link${path.replaceAll('/', '-')}`);
      await expect(navItem).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('#app-nav-link-help')).not.toHaveAttribute('aria-current');
      if (hidden) await expect(page.locator(hidden)).toHaveCount(0);
    });
  });
});

test.describe('Navigation', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test.beforeEach(({ page }) =>
    // OPEN is required for unauthenticated users to reach any page at all; the
    // root layout redirects to /login when it's off and there's no token.
    mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] }),
  );
  test('Clicking the session avatar navigates to login when logged out', async ({ page }) => {
    // Given
    await page.goto('/');

    // When
    const loginButton = page.locator('#app-nav-login');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Then
    await page.waitForURL(/\/login\?redirectTo=/);
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe('/');
  });
  test('Clicking the session avatar preserves query params in the login redirect', async ({
    page,
  }) => {
    // Given
    await page.goto('/?search=somedata');

    // When
    const loginButton = page.locator('#app-nav-login');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Then
    await page.waitForURL(/\/login\?redirectTo=/);
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe('/?search=somedata');
  });
  test('Clicking the logo navigates to the landing page', async ({ page }) => {
    // Given
    await page.goto('/help');

    // When
    const logo = page.getByTestId('app-nav-logo');
    await logo.click();

    // Then
    await expect(page).toHaveURL('/');
    await expect(page.locator('#landing-page')).toBeVisible();
  });
  test('Print page hides navigation links', async ({ page }) => {
    // Given
    await page.goto('/');

    // When
    await page.emulateMedia({ media: 'print' });

    // Then
    await expect(page.locator('#app-nav')).not.toBeVisible();
  });
});

test.describe('Access control', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test('Unauthenticated user is redirected to /login when OPEN is off', async ({ page }) => {
    // Given — OPEN off is the default, but set it explicitly so the test still
    // documents the branch under test if that default ever changes.
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'false' }] });

    // When
    await page.goto('/');

    // Then
    await expect(page).toHaveURL('/login?redirectTo=%2F');
  });

  test('A deep link keeps its destination through the forced login', async ({ page }) => {
    // Given: /help has no guard of its own, so only the root layout's login guard redirects
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'false' }] });

    // When
    await page.goto('/help?section=faq');

    // Then
    await expect(page).toHaveURL(`/login?redirectTo=${encodeURIComponent('/help?section=faq')}`);
  });

  test('/discover redirects to /explorer when DISCOVER is off', async ({ page }) => {
    // Given — OPEN on so the root layout's login guard doesn't fire first; OPEN_EXPLORER
    // also on since config.features.explorer.open is OPEN_EXPLORER && OPEN (both default
    // false, see config/schema.ts) and landing on /explorer while it's off would bounce
    // an unauthenticated user straight to /login, masking the redirect under test.
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'true' },
        { name: 'DISCOVER', value: 'false' },
      ],
    });
    // /explorer loads its facets as soon as it hydrates.
    await mockApiSuccess(page, '*/**/picsure/dictionary/facets', []);

    // When
    await page.goto('/discover');

    // Then
    await expect(page).toHaveURL('/explorer');
  });
});

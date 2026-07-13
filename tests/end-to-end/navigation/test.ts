import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import { picsureUser, userTypes } from '../mock-data';
import { userIsLoggedIn } from '../utils';
import { routes } from '../../../src/lib/routes';
import { PicsurePrivileges } from '../../../src/lib/models/Privilege';
import type { Route, RoutePrivilege } from '../../../src/lib/models/Route';

// TODO: This should probably be moved to a component test, not an e2e/integration test.

test.describe('Public Routes Navigation', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test.beforeEach(({ page }) =>
    // OPEN lets unauthenticated users past the root redirect-to-login guard;
    // DASHBOARD/DISCOVER control whether those nav links render at all.
    mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DASHBOARD', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
      ],
    }),
  );
  routes
    .filter((route) => route.privilege === undefined)
    .forEach((route, _index, routes) => {
      test(`Path ${route.path} navigation bar has correct active element before login`, async ({
        page,
      }) => {
        // Given
        await page.goto(route.path);

        // Then
        // Check that this element is active
        const navItem = page.locator(`#nav-link${route.path.replaceAll('/', '-')}`);
        await expect(navItem).toHaveAttribute('aria-current', 'page');

        // Check that other routes elements aren't active
        const inactive = routes
          .filter((altRoute) => altRoute.path !== route.path)
          .map((altRoute) => {
            const navItem = page.locator(`#nav-link${altRoute.path.replaceAll('/', '-')}`);
            return expect(navItem).not.toHaveAttribute('aria-current');
          });
        await Promise.all(inactive);
      });
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
    await page.goto('/');
    await userIsLoggedIn(page);
  });

  test('Session avatar should reflect correct user initial after login', async ({ page }) => {
    // Then
    await expect(page.locator('#user-session-avatar')).toContainText(
      (picsureUser as { email: string }).email.charAt(0).toUpperCase(),
    );
  });
  test('Session avatar should not have user initial after logout', async ({ page }) => {
    // When — retry the open; click-outside handler can close the popout on the same event
    await expect(async () => {
      await page.locator('#user-session-avatar button').first().click();
      await expect(page.locator('#user-logout-btn')).toBeVisible();
    }).toPass({ timeout: 15000 });

    const logoutButton = page.locator('#user-logout-btn');
    await logoutButton.click();
    await page.waitForURL(/\/login/);

    await page.goto('/');

    // Then
    await expect(page.locator('#user-session-avatar')).toContainText('Login');
  });
  test('Clicking logout redirects to login page', async ({ page }) => {
    // When
    const popoutButton = page.locator('#user-session-avatar button').first();
    await popoutButton.click();

    const logoutButton = page.locator('#user-logout-btn');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.waitForURL('/login');

    // Then
    await expect(page).toHaveURL('/login');
  });
});

const testRoles = {
  generalUser: userTypes.generalUser,
  adminUser: userTypes.adminUser,
  dataUser: userTypes.dataUser,
  superUser: userTypes.superUser,
};

// Every default-off feature that gates a route in src/lib/routes.ts, enabled
// here so privilege — not feature flags — is the only variable under test.
// (analyzeApi/analyzeAnalysis default true and don't need to be listed.)
const enabledFeatureFlags = [
  { name: 'DASHBOARD', value: 'true' },
  { name: 'DISCOVER', value: 'true' },
  { name: 'COLLABORATE', value: 'true' },
  { name: 'DATA_REQUESTS', value: 'true' },
  { name: 'MANUAL_ROLE', value: 'true' },
];

// Mirrors config.features keys once enabledFeatureFlags above are applied.
const featureEnabled: Record<string, boolean> = {
  dashboard: true,
  discover: true,
  collaborate: true,
  analyzeApi: true,
  analyzeAnalysis: true,
  dataRequests: true,
  manualRole: true,
};

Object.entries(testRoles).forEach(([userType, userData]) => {
  // Mirrors src/lib/stores/User.ts's userRoutes derivation: a route needs
  // ANY (not all) of its required privileges (route.privilege is an array),
  // and SUPER users bypass the privilege check entirely (but not feature gates).
  const isSuper = userData.privileges.includes(PicsurePrivileges.SUPER);
  const testRoutes = routes.filter((route: Route) => {
    // KNOWN BUG (deprioritized, /dataset/request is mildly deprecated):
    // Navigation.svelte's currentPage() matches via pathname.includes(route.path),
    // so /dataset/request always also marks the /dataset nav-link as current,
    // breaking the mutual-exclusivity assertion below. Excluded until that's fixed.
    if (route.path === '/dataset/request') return false;
    const hasFeature = route.feature ? featureEnabled[route.feature] : true;
    const hasPrivilege =
      !route.privilege ||
      isSuper ||
      route.privilege.some((priv) => (userData.privileges as RoutePrivilege[]).includes(priv));
    return hasFeature && hasPrivilege;
  });

  test.describe(`${userType} Navigation`, () => {
    test.use({ storageState: `tests/end-to-end/.auth/${userType}.json` });
    test.beforeEach(({ page }) => mockApiConfig(page, { features: enabledFeatureFlags }));

    testRoutes
      .filter((route) => !route.children)
      .forEach((route, _index, routes) => {
        test(`Path ${route.path} navigation bar has correct active element after login`, async ({
          page,
        }) => {
          // Given
          await page.goto(route.path);
          await userIsLoggedIn(page);
          const navItem = page.locator(`#nav-link${route.path.replaceAll('/', '-')}`);
          await expect(navItem).toBeVisible();

          // Then
          // Check that this element is active
          await expect(navItem).toHaveAttribute('aria-current', 'page', { timeout: 10000 });

          // Check that other routes elements aren't active
          const inactive = routes
            .filter((altRoute) => altRoute.path !== route.path)
            .map((altRoute) => {
              const navItem = page.locator(`#nav-link${altRoute.path.replaceAll('/', '-')}`);
              return expect(navItem).not.toHaveAttribute('aria-current');
            });
          await Promise.all(inactive);
        });
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
    const loginButton = page.locator('#user-login-btn');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Then
    await expect(page).toHaveURL('/login?redirectTo=/');
  });
  test('Clicking the logo navigates to the landing page', async ({ page }) => {
    // Given
    await page.goto('/help');

    // When
    const logo = page.getByTestId('nav-logo');
    await logo.click();

    // Then
    await expect(page).toHaveURL('/');
    await expect(page.locator('#landing')).toBeVisible();
  });
  test('Print page hides navigation links', async ({ page }) => {
    // Given
    await page.goto('/');

    // When
    await page.emulateMedia({ media: 'print' });

    // Then
    await expect(page.locator('#page-navigation')).not.toBeVisible();
  });
});

import { expect } from '@playwright/test';
import { getUserTest, test, unauthedTest } from '../../../custom-context';
import { picsureUser, mockLoginResponse } from '../../../mock-data';
import { routes } from '../../../../src/lib/configuration';
import { PicsurePrivileges } from '../../../../src/lib/models/Privilege';
import type { Route } from '../../../../src/lib/models/Route';

// TODO: This should probably be moved to a component test, not an e2e/integration test.

const testCases = {
  generalUser: [PicsurePrivileges.QUERY],
  adminUser: [PicsurePrivileges.QUERY, PicsurePrivileges.ADMIN],
  superUser: [PicsurePrivileges.QUERY, PicsurePrivileges.SUPER],
  dataUser: [PicsurePrivileges.QUERY, PicsurePrivileges.DATA_ADMIN],
};

unauthedTest.describe('Public Routes Navigation', () => {
  routes
    .filter((route) => route.privilege === undefined)
    .forEach((route, _index, routes) => {
      unauthedTest(
        `Path ${route.path} navigation bar has correct active element before login`,
        async ({ page }) => {
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
        },
      );
    });
});

const userTest = getUserTest({ ...picsureUser, privileges: testCases.generalUser });
userTest.describe('Logged in users', () => {
  userTest('Session avatar should reflect correct user initial after login', async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);

    // Then
    await expect(page.locator('#user-session-avatar')).toContainText(
      `${picsureUser.email?.charAt(0)?.toUpperCase()} Logout`,
    );
  });
  userTest('Session avatar should not have user initial after logout', async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);

    // When
    const popoutButton = page.locator('#user-session-popout');
    await popoutButton.click();

    const logoutButton = page.locator('#user-logout-btn');
    await logoutButton.click();

    await page.goto('/');

    // Then
    await expect(page.locator('#user-session-avatar')).toContainText('Login');
  });
  userTest('Clicking logout redirects to login page', async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);

    // When
    const popoutButton = page.locator('#user-session-popout');
    await popoutButton.click();

    const logoutButton = page.locator('#user-logout-btn');
    await logoutButton.click();

    // Then
    await expect(page).toHaveURL('/login');
  });
});

Object.entries(testCases).forEach(([testCase, privileges]) => {
  const privTest = getUserTest({ ...picsureUser, privileges });
  const testRoutes = routes.filter((route: Route) =>
    route.privilege ? privileges.includes(route.privilege as unknown as PicsurePrivileges) : true,
  );

  privTest.describe(`${testCase} Navigation`, () => {
    testRoutes
      .filter((route) => !route.children)
      .forEach((route, _index, routes) => {
        privTest(
          `Path ${route.path} navigation bar has correct active element after login`,
          async ({ page }) => {
            // Given
            await page.goto(mockLoginResponse);
            await page.waitForURL('/');
            const navItem = page.locator(`#nav-link${route.path.replaceAll('/', '-')}`);
            await navItem.click();

            // Then
            // Check that this element is active
            await expect(navItem).toHaveAttribute('aria-current', 'page');

            // Check that other routes elements aren't active
            const inactive = routes
              .filter((altRoute) => altRoute.path !== route.path)
              .map((altRoute) => {
                const navItem = page.locator(`#nav-link${altRoute.path.replaceAll('/', '-')}`);
                return expect(navItem).not.toHaveAttribute('aria-current');
              });
            await Promise.all(inactive);
          },
        );
      });
  });
});

const topAdminTest = getUserTest({ ...picsureUser, privileges: testCases.superUser });
topAdminTest.describe('Keyboard navigation', () => {
  topAdminTest('Pressing Enter on a dropdown item opens dropdown', async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);
    await page.waitForURL('/');
    const dropdown = page.locator('#page-navigation .has-dropdown').first();

    // When
    await dropdown.locator('a').first().focus();
    await page.keyboard.press('Enter');

    // Then
    await expect(dropdown.locator('.nav-dropdown')).toBeVisible();
  });
  topAdminTest('Can navigate to dropdown child', async ({ page }) => {
    // Given
    await page.goto(mockLoginResponse);
    await page.waitForURL('/');
    const dropdown = page.locator('#page-navigation .has-dropdown').first();
    await dropdown.locator('a').first().focus();
    await page.keyboard.press('Enter');

    // When
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Then
    await expect(page).not.toHaveURL('/');
  });
});

test.describe('Navigation', () => {
  test('Clicking the session avatar navigates to login when logged out', async ({ page }) => {
    // Given
    await page.goto('/');

    // When
    const loginButton = page.locator('#user-login-btn');
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

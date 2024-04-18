import { expect, type Route } from '@playwright/test';
import { test } from '../../../custom-context';
import {
  datasets as mockDatasets,
  searchResults as mockSearchResults,
  searchResultPath,
  user as mockUser,
} from '../../../mock-data';

// TODO: This should probably be moved to a component test, not an e2e/integration test.

test.describe('navigation', () => {
  const routes = [
    { path: '/admin/authorization', id: 'nav-link-admin' },
    { path: '/user', id: 'nav-link-user' },
    {
      path: '/explorer',
      id: 'nav-link-explorer',
      mock: { path: searchResultPath, data: mockSearchResults },
    },
    { path: '/api', id: 'nav-link-api' },
    {
      path: '/dataset',
      id: 'nav-link-dataset',
      mock: { path: '*/**/picsure/dataset/named', data: mockDatasets },
    },
    { path: '/help', id: 'nav-link-help' },
  ];
  routes.forEach((route, _index, routes) => {
    test(`Path ${route.path} navigation bar has correct active element`, async ({ page }) => {
      // Given
      if (route.mock) {
        await page.route(route.mock.path, (r: Route) => r.fulfill({ json: route.mock.data }));
      }
      await page.goto(route.path);

      // Then
      // Check that this element is active
      const navItem = page.locator('#' + route.id);
      await expect(navItem).toHaveAttribute('aria-current', 'page');

      // Check that other routes elements aren't active
      const inactive = routes
        .filter((altRoute) => altRoute.path !== route.path)
        .map((altRoute) => {
          const navItem = page.locator('#' + altRoute.id);
          return expect(navItem).not.toHaveAttribute('aria-current');
        });
      await Promise.all(inactive);
    });
  });
  test('Clicking the logo navigates to the landing page', async ({ page }) => {
    // Given
    await page.goto('/help');

    // When
    const logo = page.locator('#nav-logo');
    await logo.click();

    // Then
    await expect(page).toHaveURL('/');
    await expect(page.locator('#search-box')).toBeVisible();
  });
  test('Print page hides navigation links', async ({ page }) => {
    // Given
    await page.goto('/');

    // When
    await page.emulateMedia({ media: 'print' });

    // Then
    await expect(page.locator('#page-navigation')).not.toBeVisible();
  });
  test.describe('Keyboard navigation', () => {
    test('Pressing Enter on a dropdown item opens dropdown', async ({ page }) => {
      // Given
      await page.goto('/');
      const dropdown = page.locator('#page-navigation .has-dropdown').first();

      // When
      await dropdown.locator('a').first().focus();
      await page.keyboard.press('Enter');

      // Then
      await expect(dropdown.locator('.nav-dropdown')).toBeVisible();
    });
    test('Can navigate to dropdown child', async ({ page }) => {
      // Given
      await page.goto('/');
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
  test('Session avatar should reflect correct user initial after login', async ({ page }) => {
    // Given
    await page.goto('/');

    // Then
    await expect(page.locator('#user-session-avatar')).toContainText(
      `${mockUser.email[0].toUpperCase()} Logout`,
    );
  });
  test('Session avatar should not have user initial after logout', async ({ page }) => {
    // Given
    await page.goto('/');

    // When
    const popoutButton = page.locator('#user-session-popout');
    await popoutButton.click();

    const logoutButton = page.locator('#user-logout-btn');
    await logoutButton.click();

    // Then
    await expect(page.locator('#user-session-avatar')).toContainText('Login');
  });
});

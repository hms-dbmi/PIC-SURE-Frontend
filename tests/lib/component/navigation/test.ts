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
    { path: '/users', id: 'nav-link-users' },
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
    test('Gives visual indicator of focus to parent container', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();

      // When
      await page.keyboard.press('Tab');

      // Then
      await expect(page.locator('#page-navigation')).toHaveClass(/key-focus/);
    });
    test('Can move between links with right arrow', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');

      await expect(page.locator('#' + routes[2].id)).toBeFocused();
    });
    test('Can move between links with left arrow', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');

      // Then
      await expect(page.locator('#' + routes[routes.length - 2].id)).toBeFocused();
    });
    test('Can move to last link with End key', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('End');

      await expect(page.locator('#' + routes[routes.length - 1].id)).toBeFocused();
    });
    test('Can move to first link with Home key', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('#' + routes[routes.length - 1].id)).toBeFocused();
      await page.keyboard.press('Home');

      await expect(page.locator('#' + routes[0].id)).toBeFocused();
    });
    test('Can select link with Space key', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press(' ');

      // Then
      await expect(page).toHaveURL(routes[0].path);
    });
    test('Can select link with Enter key', async ({ page }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('Enter');

      // Then
      await expect(page).toHaveURL(routes[0].path);
    });
    test('Pressing first char of link text should move focus directly to link', async ({
      page,
    }) => {
      // Given
      await page.goto('/');
      const logoLink = page.getByTestId('logo-home-link');
      await logoLink.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('a');

      // Then
      await expect(page.locator('#' + routes[2].id)).toBeFocused();
    });
  });
  test('Logout button should reflect correct user initial', async ({ page }) => {
    // Given
    await page.goto('/');

    // Then
    await expect(page.locator('#user-session-btn')).toContainText(
      `${mockUser.email[0].toUpperCase()} Loggout`,
    );
  });
  test('Login button should not have user initial', async ({ page }) => {
    // Given
    await page.goto('/');
    const logoutButton = page.locator('#user-session-btn');
    await logoutButton.click();

    // Then
    await expect(page.locator('#user-session-btn')).toContainText('Login');
  });
});

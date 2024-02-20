import { expect, type Route } from '@playwright/test';
import { test } from '../../../custom-context';
import { datasets as mockData } from '../../../mock-data';

// TODO: This should probably be moved to a component test, not an e2e/integration test.

test.describe('navigation', () => {
  const routes = [
    { path: '/explorer', id: 'nav-link-explorer', headerText: 'Explorer/Query Builder' },
    { path: '/users', id: 'nav-link-users', headerText: 'Users' },
    { path: '/api', id: 'nav-link-api', headerText: 'API' },
    {
      path: '/dataset',
      id: 'nav-link-dataset',
      headerText: 'Dataset Management',
      mock: { path: '*/**/picsure/dataset/named', data: mockData }
    },
    { path: '/help', id: 'nav-link-help', headerText: 'Knowledge Hub' },
    { path: '/admin', id: 'nav-link-admin', headerText: 'Admin' }
  ];

  routes.forEach((route) => {
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

      // Check that other elements aren't active
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
});

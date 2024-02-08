import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', id: 'nav-link-home', headerText: 'Home' },
  { path: '/explorer', id: 'nav-link-explorer', headerText: 'Explorer/Query Builder' },
  { path: '/users', id: 'nav-link-users', headerText: 'Users' },
  { path: '/api', id: 'nav-link-api', headerText: 'API' },
  { path: '/dataset', id: 'nav-link-dataset', headerText: 'Dataset Management' },
  { path: '/help', id: 'nav-link-help', headerText: 'Help' },
  { path: '/admin', id: 'nav-link-admin', headerText: 'Admin' },
  { path: '/admin/super', id: 'nav-link-admin-super', headerText: 'Super Admin' },
  { path: '/#', id: 'nav-link-logout', headerText: 'Home' }
];

test.describe('Navigation', () => {
  routes.forEach((route) => {
    test(`${route.path} page has expected heading`, async ({ page }) => {
      await page.goto('/');
      const navItem = page.locator('#' + route.id);
      await navItem.click();
      await expect(page.locator('.main-content>h1')).toHaveText(route.headerText);
    });
  });
});

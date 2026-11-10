import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import { picsureUser } from '../mock-data';

// Adds a link the app doesn't have and follows it, so the navigation goes through the
// client router instead of a full page load.
async function clickInAppLink(page: Page, href: string) {
  await page.evaluate((href) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = 'test link';
    link.dataset.testid = 'test-link';
    document.body.append(link);
  }, href);
  await page.getByTestId('test-link').click();
}

test.describe('Routing', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test('An unknown URL shows the branded 404 page inside the app shell', async ({ page }) => {
    const response = await page.goto('/no-such-page');

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('app-error-status')).toHaveText('404');
    await expect(page.getByTestId('app-error-title')).toHaveText('Page not found');
    await expect(page.locator('#app-nav')).toBeVisible();
    await expect(page.locator('#app-page-footer')).toBeVisible();

    await page.getByTestId('app-error-home').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('app-error-status')).toBeHidden();
  });

  test('A link to an unknown URL shows the branded 404 page', async ({ page }) => {
    await page.goto('/');
    await clickInAppLink(page, '/no-such-page');

    await expect(page).toHaveURL(/\/no-such-page$/);
    await expect(page.getByTestId('app-error-status')).toHaveText('404');
  });

  test('The retired /analyze URLs redirect to /api', async ({ page, request }) => {
    await mockApiConfig(page, { features: [{ name: 'ANALYZE_API', value: 'true' }] });
    // The /api page loads the user's token.
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);

    for (const [path, status] of [
      ['/analyze', 302],
      ['/analyze/api', 301],
      ['/analyze/api/docs', 301],
    ] as const) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(status);
      expect(response.headers()['location'], path).toBe('/api');
    }

    await page.goto('/analyze');
    await expect(page).toHaveURL(/\/api$/);

    await page.goto('/');
    await clickInAppLink(page, '/analyze/api');
    await expect(page).toHaveURL(/\/api$/);
  });

  test('Hovering nav links sends no request to the server or PSAMA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const requests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname === 'localhost' && !url.pathname.startsWith('/_app/')) {
        requests.push(`${request.method()} ${url.pathname}`);
      }
    });

    const links = page.locator('#app-nav a[href^="/"]');
    expect(await links.count()).toBeGreaterThan(1);
    for (const link of await links.all()) {
      // Hover preloads the route's code, which also shows the preload has run.
      const codePreloaded = page.waitForRequest((request) =>
        request.url().includes('/_app/immutable/nodes/'),
      );
      await link.hover();
      await codePreloaded;
    }

    expect(requests).toEqual([]);
  });
});

test.describe('Routing on a closed deployment', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test('A logged-out visitor sees the 404 page without the app shell', async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'false' }] });

    // Paths under /login are exempt from the forced login redirect.
    const response = await page.goto('/login/no-such-page');

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId('app-error-status')).toHaveText('404');
    await expect(page.getByTestId('app-error-home')).toBeVisible();
    await expect(page.locator('#app-nav')).toBeHidden();
  });
});

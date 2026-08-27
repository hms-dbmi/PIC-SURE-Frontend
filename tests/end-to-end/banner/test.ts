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
    await page.route('**/picsure/operations/banners/active', async (route) => {
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

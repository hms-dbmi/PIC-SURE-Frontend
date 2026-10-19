import { expect } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import { mockToken, picsureUser } from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';

const tokenExpiry = new Date(JSON.parse(atob(mockToken.split('.')[1])).exp * 1000);

test.describe('A session that expires while the tab is open', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  // /api loads the long-term token into the profile, which once made the login page send the
  // user home instead of ending the session.
  for (const start of ['/', '/api']) {
    test(`sends the user to log in again from the next page they open (from ${start})`, async ({
      page,
      context,
    }) => {
      // OPEN, so only the authorized guard can send the user to log in.
      await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
      await mockApiSuccess(context, '*/**/psama/user/me?hasToken', {
        ...picsureUser,
        token: mockToken,
      });
      await page.clock.install();
      await page.goto(start);
      await userIsLoggedIn(page);
      if (start === '/api') await expect(page.getByTestId('user-token-expires')).toBeVisible();

      await page.clock.setSystemTime(new Date(tokenExpiry.getTime() + 60_000));
      await page.locator('#app-nav-link-dataset').click();

      await expect(page).toHaveURL('/login?redirectTo=%2Fdataset&reason=expired');
      await expect(page.getByTestId('toast-root')).toContainText(
        'Your session has timed out. Please log in again.',
      );
      await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    });
  }

  test('ends the session when Back returns to a page that needs a login', async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    await mockApiSuccess(page, '*/**/picsure/operations/dataset/named', []);
    await page.clock.install();
    await page.goto('/dataset');
    await userIsLoggedIn(page);
    await page.locator('#app-nav-link-help').click();
    await expect(page).toHaveURL('/help');

    await page.clock.setSystemTime(new Date(tokenExpiry.getTime() + 60_000));
    await page.goBack();

    // SvelteKit leaves the address Back went to when a guard redirects that navigation.
    await expect(page.locator('#login-page')).toBeVisible();
    await expect(page.getByTestId('toast-root')).toContainText(
      'Your session has timed out. Please log in again.',
    );
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});

import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import { mockToken } from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';

const tokenExpiry = new Date(JSON.parse(atob(mockToken.split('.')[1])).exp * 1000);

test.describe('A session that expires while the tab is open', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test('sends the user to log in again from the next page they open', async ({ page }) => {
    // OPEN, so only the authorized guard can send the user to log in.
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    await page.clock.install();
    await page.goto('/');
    await userIsLoggedIn(page);

    await page.clock.setSystemTime(new Date(tokenExpiry.getTime() + 60_000));
    await page.locator('#app-nav-link-dataset').click();

    await expect(page).toHaveURL('/login?redirectTo=%2Fdataset&reason=expired');
    await expect(page.getByTestId('toast-root')).toContainText(
      'Your session has timed out. Please log in again.',
    );
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});

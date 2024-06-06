import { expect } from '@playwright/test';
import { unauthedTest } from '../../custom-context';

const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';


unauthedTest.describe('Login page', () => {
  const enabledProviders = Object.keys(process.env)
    .filter((key) => key.startsWith(PROVIDER_PREFIX) && process.env[key] === 'true')
    .map((key) => key.replace(PROVIDER_PREFIX, '').toUpperCase());
  unauthedTest('No navigation bar before login', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const navBar = page.locator('nav');
    // Then
    await expect(navBar).not.toBeVisible();
  });
  unauthedTest('Logo shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const logo = page.locator('img#nav-logo');
    // Then
    await expect(logo).toBeVisible();
  });
  unauthedTest('Login button shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    for (const providerName of enabledProviders) {
      let buttonText = providerName.toLowerCase();
      let testId = `login-button-${buttonText}`
      const loginButton = page.getByTestId(testId);
      await expect(loginButton).toBeVisible();
    }
    // Then
  });
  for (const providerName of enabledProviders) {
    unauthedTest(`Clicking the ${providerName} login button opens the idp login page`, async ({ page }) => {
      // Given
      await page.goto('/login');
      // When
      let buttonText = providerName.toLowerCase();
      let testId = `login-button-${buttonText}`
      const loginButton = page.getByTestId(testId);
      await loginButton.click();
      // Then
      switch (providerName) {
        case 'AUTH0':
          await expect(page).toHaveURL(/avillachlab.auth0.com/);
          break;
        case 'RAS':
          let rasUrl = process.env.VITE_AUTH_PROVIDER_MODULE_RAS_URI;
          if (!rasUrl) {
            throw new Error('RAS_URL not set in .env');
          }
          let rasUrlRegex = RegExp('^'+rasUrl);
          await expect(page).toHaveURL(rasUrlRegex);
          break;
        case 'FENCE':
          let fenceUrl = process.env.VITE_AUTH_PROVIDER_MODULE_FENCE_URI;
          if (!fenceUrl) {
            throw new Error('FENCE_URL not set in .env');
          }
          let fenceUrlRegex = RegExp('^'+fenceUrl);
          await expect(page).toHaveURL(fenceUrlRegex);
          break;
      }
    });
  }
});

import { expect } from '@playwright/test';
import { unauthedTest } from '../../custom-context';
import { branding } from '../../../src/lib/configuration';

const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';

//TODO: Tests for login dropdown


unauthedTest.describe('Login page', () => {
  const enabledProviders = Object.keys(process.env)
      .filter((key) => key.startsWith(PROVIDER_PREFIX) && process.env[key] === 'true')
      .map((key) => key.replace(PROVIDER_PREFIX, '').toUpperCase())
      .filter((key) => !key.includes('_'));
    const altProviders: string[] = [];
    enabledProviders.forEach((providerName) => {
      let test = Object.keys(process.env).filter((key) => key.startsWith(`${PROVIDER_PREFIX}${providerName}_ALT`) && process.env[key] === 'true').map((key) => key.replace(`${PROVIDER_PREFIX}_ALT`, '').toUpperCase());
      if (test.length > 0) {
        altProviders.push(providerName);
      }
    });
  unauthedTest('No navigation bar before login', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const navBar = page.locator('nav');
    // Then
    await expect(navBar).not.toBeVisible();
  });
  unauthedTest('Both dots show on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const topDots = page.locator('.top-dots');
    const bottomDots = page.locator('.bottom-dots');
    // Then
    await expect(topDots).toBeVisible();
    await expect(bottomDots).toBeVisible();
  });
  unauthedTest('Logo shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const logo = page.getByTestId('nav-logo');
    // Then
    await expect(logo).toBeVisible();
  });
  unauthedTest('Footer shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const footer = page.locator('#main-footer');
    // Then
    await expect(footer).toBeVisible();
  });
  unauthedTest('Title shows on the page and matching branding', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const title = page.getByTestId('login-title');
    console.log('title', title);
    const expectedBranding = branding.login.title || 'Welcome to PIC-SURE';
    // Then
    await expect(title).toBeVisible();
    expect(await title.textContent()).toBe(expectedBranding);
  });
  unauthedTest('Description shows on the page and matching branding', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const subtitle = page.getByTestId('login-description');
    const expectedBranding =
      branding.login.description ||
      'Where searching for, filtering on, and exporting data is made simple.';
    // Then
    await expect(subtitle).toBeVisible();
    await expect(await subtitle.textContent()).toBe(expectedBranding);
  });
  unauthedTest('Login button shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    for (const providerName of enabledProviders) {
      const testId = `login-button-${providerName.toLowerCase()}`;
      const loginButton = page.getByTestId(testId);
      await expect(loginButton).toBeVisible();
    }
    // Then
  });
  unauthedTest('Alternate logins show below the other logins', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const altLoginsContainer = page.locator('#alt-logins');
    // Then
    if (altProviders.length > 0) {
      await expect(altLoginsContainer).toBeVisible();
      for (const providerName of altProviders) {
        const testId = `login-button-${providerName.toLowerCase()}`;
        const loginButton = altLoginsContainer.getByTestId(testId);
        await expect(loginButton).toBeVisible();
      };
    }
  });
  for (const providerName of enabledProviders) {
    unauthedTest(
      `Clicking the ${providerName} login button opens the idp login page`,
      async ({ page }) => {
        // Given
        await page.goto('/login');
        // When
        const testId = `login-button-${providerName.toLowerCase()}`;
        const loginButton = page.getByTestId(testId);
        await loginButton.click();
        // Then
        switch (providerName) {
          case 'AUTH0': {
            await expect(page).toHaveURL(/avillachlab.auth0.com/);
            break;
          }
          case 'RAS': {
            const rasUrl = process.env.VITE_AUTH_PROVIDER_MODULE_RAS_URI;
            if (!rasUrl) {
              throw new Error('RAS_URL not set in .env');
            }
            const rasUrlRegex = RegExp('^' + rasUrl);
            await expect(page).toHaveURL(rasUrlRegex);
            break;
          }
          case 'FENCE': {
            const fenceUrl = process.env.VITE_AUTH_PROVIDER_MODULE_FENCE_URI;
            if (!fenceUrl) {
              throw new Error('FENCE_URL not set in .env');
            }
            const fenceUrlRegex = RegExp('^' + fenceUrl);
            await expect(page).toHaveURL(fenceUrlRegex);
            break;
          }
          default: {
            throw new Error('Unknown provider');
          }
        }
      },
    );
  }
});

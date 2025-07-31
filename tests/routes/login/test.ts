import { expect } from '@playwright/test';
import { test, mockHTMLBodySuccess } from '../../custom-context';
import * as config from '../../../src/lib/assets/configuration.json' assert { type: 'json' };
import type { Branding } from '$lib/configuration';
//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));
const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';

//TODO: Tests for login dropdown

test.describe('Google consent', () => {
  test('Google Consent Modal shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const googleConsentModal = page.getByTestId('consentModal');
    // Then
    await expect(googleConsentModal).toBeVisible();
  });
  test('Accept Google Consent hides modal', async ({ page }) => {
    // Given Google Consent Modal is open
    await page.goto('/login');
    await page.waitForSelector('[data-testid="consentModal"]');

    // When
    const acceptConsentButton = page.getByTestId('acceptGoogleConsent');
    await acceptConsentButton.click();

    // Then expect the consentModal to be hidden
    await expect(page.getByTestId('[data-testid="consentModal"]')).not.toBeVisible();
  });

  test('Reject Google Consent hides modal', async ({ page }) => {
    // Given Google Consent Modal is open
    await page.goto('/login');
    await page.waitForSelector('[data-testid="consentModal"]');

    // When
    const denyConsentButton = page.getByTestId('rejectGoogleConsent');
    await denyConsentButton.click();

    // Then expect the consentModal to be hidden
    await expect(page.getByTestId('[data-testid="consentModal"]')).not.toBeVisible();
  });
  test("Google Consents saved in local storage on reject as 'denied'", async ({ page }) => {
    // Given Google Consent Modal is open
    await page.goto('/login');
    await page.waitForSelector('[data-testid="consentModal"]');

    // When
    const denyConsentButton = page.getByTestId('rejectGoogleConsent');
    await denyConsentButton.click();

    // Then google consents are saved in local storage and are 'denied'
    const googleConsent = await page.evaluate(() => localStorage.getItem('consentMode'));
    expect(googleConsent).not.toBeNull();
    if (googleConsent) {
      const parsedGoogleConsent = JSON.parse(googleConsent);
      expect(parsedGoogleConsent).toHaveProperty('ad_storage', 'denied');
      expect(parsedGoogleConsent).toHaveProperty('analytics_storage', 'denied');
      expect(parsedGoogleConsent).toHaveProperty('personalization_storage', 'denied');
      expect(parsedGoogleConsent).toHaveProperty('ad_user_data', 'denied');
      expect(parsedGoogleConsent).toHaveProperty('ad_personalization', 'denied');
      expect(parsedGoogleConsent).toHaveProperty('ad_data', 'denied');
    }
  });
});

test.describe('Login page', () => {
  test.use({ storageState: 'tests/.auth/generalUser.json' });

  const enabledProviders = Object.keys(process.env)
    .filter((key) => key.startsWith(PROVIDER_PREFIX) && process.env[key] === 'true')
    .map((key) => key.replace(PROVIDER_PREFIX, '').toUpperCase())
    .filter((key) => !key.includes('_'));
  const altProviders: string[] = [];
  enabledProviders.forEach((providerName) => {
    const test = Object.keys(process.env)
      .filter(
        (key) =>
          key.startsWith(`${PROVIDER_PREFIX}${providerName}_ALT`) && process.env[key] === 'true',
      )
      .map((key) => key.replace(`${PROVIDER_PREFIX}_ALT`, '').toUpperCase());
    if (test.length > 0) {
      altProviders.push(providerName);
    }
  });
  test('No navigation bar before login', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const navBar = page.locator('nav');
    // Then
    await expect(navBar).not.toBeVisible();
  });
  test('Both dots show on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const topDots = page.locator('.top-dots');
    const bottomDots = page.locator('.bottom-dots');
    // Then
    await expect(topDots).toBeVisible();
    await expect(bottomDots).toBeVisible();
  });
  test('Logo shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const logo = page.getByTestId('nav-logo');
    // Then
    await expect(logo).toBeVisible();
  });
  test('Footer shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const footer = page.locator('#main-footer');
    // Then
    await expect(footer).toBeVisible();
  });
  test('Title shows on the page and matching branding', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const title = page.getByTestId('login-title');
    // Then
    await expect(title).toBeVisible();
  });
  test('Description shows on the page and matching branding', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    const subtitle = page.getByTestId('login-description');
    const expectedBranding = branding?.login?.description;
    // Then
    await expect(subtitle).toBeVisible();
    expect(await subtitle.textContent()).toBe(expectedBranding);
  });
  test('Login button shows on login page', async ({ page }) => {
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
  test('Alternate logins show below the other logins', async ({ page }) => {
    // Given
    await page.goto('/login');

    const loginContainer = page.locator('#login-box');

    // Then
    if (altProviders.length > 0) {
      await expect(loginContainer).toBeVisible();
      for (const providerName of altProviders) {
        const testId = `login-button-${providerName.toLowerCase()}`;
        const loginButton = loginContainer.getByTestId(testId);
        await expect(loginButton).toBeVisible();
      }
    }
  });
  for (const providerName of enabledProviders) {
    const providerUrl: { [key: string]: string | undefined } = {
      AUTH0: 'https://avillachlab.auth0.com/',
      RAS: process.env.VITE_AUTH_PROVIDER_MODULE_RAS_URI,
      FENCE: process.env.VITE_AUTH_PROVIDER_MODULE_FENCE_URI,
    };
    test(`Clicking the ${providerName} login button opens the idp login page`, async ({ page }) => {
      const url = providerUrl[providerName];
      if (!url) {
        throw new Error(providerName + ' not set in .env');
      }
      const urlMatcher = RegExp('^' + url);

      // Given
      mockHTMLBodySuccess(page, urlMatcher, '<h1>Some IDP Login Page</h1>');
      await page.goto('/login');

      // When
      const testId = `login-button-${providerName.toLowerCase()}`;
      const loginButton = page.getByTestId(testId);
      await loginButton.click();

      // Then
      await expect(page).toHaveURL(urlMatcher);
    });
  }
});

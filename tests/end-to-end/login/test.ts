import { expect, type Route } from '@playwright/test';
import { test, mockHTMLBodySuccess, mockApiConfig, mockApiSuccess } from '../custom-context';
import type { Branding } from '$lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
import {
  mockToken,
  picsureUser,
  searchResultPath,
  searchResults,
  facetResultPath,
  facetsResponse,
} from '../mock-data';
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));
const PROVIDER_PREFIX = 'VITE_AUTH_PROVIDER_MODULE_';

//TODO: Tests for login dropdown

test.describe('Google consent', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      settings: [{ name: 'GOOGLE_TAG_MANAGER_ID', value: 'some-google-tag' }],
    });
  });
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
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

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

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
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
      OKTA: process.env.VITE_AUTH_PROVIDER_MODULE_OKTA_URI,
      FENCE: process.env.VITE_AUTH_PROVIDER_MODULE_FENCE_URI,
      // Skipping test for RAS as the base functionality is similar - only the logout and psama url differ
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

test.describe('Login redirect preserves search state', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    await mockApiSuccess(page, '*/**/psama/authentication', picsureUser);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: searchResults }),
    );
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
  });

  test('Search survives the redirect through login and back', async ({ page, browserName }) => {
    // Simulating the /login/loading callback this way (jumping straight to the
    // #access_token hash) is inherently racy on firefox/webkit - setup.ts uses the same
    // technique and is restricted to chromium in playwright.config.ts for that reason.
    test.skip(
      browserName !== 'chromium',
      'Login callback simulation is chromium-only, see setup.ts',
    );

    // Given: an unauthenticated user has an in-progress search and gets bounced to login
    await page.goto('/explorer?search=somedata');
    await page.waitForURL(/\/login\?redirectTo=/);
    const loginUrl = new URL(page.url());
    expect(loginUrl.pathname).toBe('/login');
    const redirectTo = loginUrl.searchParams.get('redirectTo');
    expect(redirectTo).toBe('/explorer?search=somedata');

    // When: login completes - saveState() would have recorded redirectTo before leaving
    // for the IdP, so seed it the same way rather than driving a real IdP redirect.
    // addInitScript (not evaluate) so the value survives the full-page navigation below.
    await page.addInitScript((redirect) => {
      sessionStorage.setItem('redirect', redirect as string);
      sessionStorage.setItem('type', 'AUTH0');
    }, redirectTo);
    const mockLoginResponse =
      '/login/loading/#access_token=' +
      mockToken +
      '&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G';
    // The app's own client-side goto() back to redirectTo can fire before this
    // navigation's load event settles (esp. firefox/webkit), aborting it - that's fine,
    // waitForURL below is what actually confirms we landed on the right page.
    await page.goto(mockLoginResponse).catch(() => {});

    // Then: the user lands back on the same search, and it re-runs automatically
    await page.waitForURL('/explorer?search=somedata');
    await expect(page.getByTestId('search-box')).toHaveValue('somedata');
    await expect(page.locator('table')).toBeVisible();
  });
});

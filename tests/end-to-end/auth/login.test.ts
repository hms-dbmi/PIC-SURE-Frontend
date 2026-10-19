import { expect, type Page, type Route } from '@playwright/test';
import {
  test,
  mockHTMLBodySuccess,
  mockApiConfig,
  mockApiSuccess,
  mockTermsNotAccepted,
} from '../custom-context';
import type { Branding } from '#lib/config/branding.ts';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
import {
  datasets,
  mockBanner,
  mockConsents,
  mockToken,
  picsureUser,
  searchResultPath,
  searchResults,
  facetResultPath,
  facetsResponse,
} from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';
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
    const googleConsentModal = page.getByTestId('app-consent-modal');
    // Then
    await expect(googleConsentModal).toBeVisible();
  });
  test('Accept Google Consent hides modal', async ({ page }) => {
    // Given Google Consent Modal is open
    await page.goto('/login');
    await page.waitForSelector('[data-testid="app-consent-modal"]');

    // When
    const acceptConsentButton = page.getByTestId('app-consent-accept');
    await acceptConsentButton.click();

    // Then expect the consentModal to be hidden
    await expect(page.getByTestId('app-consent-modal')).not.toBeVisible();
  });

  test('Reject Google Consent hides modal', async ({ page }) => {
    // Given Google Consent Modal is open
    await page.goto('/login');
    await page.waitForSelector('[data-testid="app-consent-modal"]');

    // When
    const denyConsentButton = page.getByTestId('app-consent-reject');
    await denyConsentButton.click();

    // Then expect the consentModal to be hidden
    await expect(page.getByTestId('app-consent-modal')).not.toBeVisible();
  });
  test("Google Consents saved in local storage on reject as 'denied'", async ({ page }) => {
    // Given Google Consent Modal is open
    await page.goto('/login');
    await page.waitForSelector('[data-testid="app-consent-modal"]');

    // When
    const denyConsentButton = page.getByTestId('app-consent-reject');
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
  test('Login page shows the branded layout without navigation', async ({ page }) => {
    // Given
    await page.goto('/login');
    // Then
    await expect(page.locator('nav')).not.toBeVisible();
    await expect(page.getByTestId('app-nav-logo')).toBeVisible();
    await expect(page.getByTestId('login-title')).toBeVisible();
    await expect(page.getByTestId('login-description')).toHaveText(
      branding?.login?.description ?? '',
    );
    await expect(page.locator('.top-dots')).toBeVisible();
    await expect(page.locator('.bottom-dots')).toBeVisible();
    await expect(page.locator('#app-footer')).toBeVisible();
  });
  test('Site banner pushes the dots down without hiding them behind the footer', async ({
    page,
  }) => {
    // Given a window short enough that the banner and login content overflow it
    await page.setViewportSize({ width: 1280, height: 480 });
    await mockApiSuccess(page, '**/picsure/operations/banners/active', [mockBanner]);
    await page.goto('/login');
    // When
    const bannerRegion = page.getByTestId('banner-region');
    await expect(bannerRegion).toBeVisible();
    const bannerBox = await bannerRegion.boundingBox();
    const topDotsBox = await page.locator('.top-dots').boundingBox();
    const bottomDotsBox = await page.locator('.bottom-dots').boundingBox();
    const footerBox = await page.locator('#app-footer').boundingBox();
    // Then
    expect(bannerBox).not.toBeNull();
    expect(topDotsBox).not.toBeNull();
    expect(bottomDotsBox).not.toBeNull();
    expect(footerBox).not.toBeNull();
    expect(topDotsBox!.y).toBeGreaterThanOrEqual(bannerBox!.y + bannerBox!.height);
    expect(bottomDotsBox!.y + bottomDotsBox!.height).toBeLessThanOrEqual(footerBox!.y);
  });
  test('Login button shows on login page', async ({ page }) => {
    // Given
    await page.goto('/login');
    // When
    for (const providerName of enabledProviders) {
      const testId = `login-provider-${providerName.toLowerCase()}`;
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
        const testId = `login-provider-${providerName.toLowerCase()}`;
        const loginButton = loginContainer.getByTestId(testId);
        await expect(loginButton).toBeVisible();
      }
    }
  });
  // MOCK has no IdP page; 'Login state' below logs in with it.
  for (const providerName of enabledProviders.filter((name) => name !== 'MOCK')) {
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
      await mockHTMLBodySuccess(page, urlMatcher, '<h1>Some IDP Login Page</h1>');
      await page.goto('/login');

      // When
      const testId = `login-provider-${providerName.toLowerCase()}`;
      const loginButton = page.getByTestId(testId);
      await loginButton.click();

      // Then
      await expect(page).toHaveURL(urlMatcher);
    });
  }
});

// MOCK leaves for /login/loading itself with a real state, so these run the whole login. An init
// script on the callback page stands in for whatever happened to the stored state meanwhile.
test.describe('Login state', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  let authentications: number;
  const restartToast = 'Your login could not be completed. Please log in again.';

  test.beforeEach(async ({ page }) => {
    authentications = 0;
    await mockApiConfig(page);
    await page.route('*/**/psama/authentication/mock', (route: Route) => {
      authentications++;
      return route.fulfill({ json: picsureUser });
    });
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: mockConsents });
  });

  const storedState = (page: Page) => page.evaluate(() => sessionStorage.getItem('loginState'));

  test('A login that comes back with its own state signs the user in', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-provider-mock').click();

    await page.waitForURL('/');
    await userIsLoggedIn(page);
    expect(authentications).toBe(1);
    expect(await storedState(page)).toBeNull();
  });

  test('A callback with another state goes to the login error page', async ({ page }) => {
    await page.addInitScript(() => {
      if (location.pathname.startsWith('/login/loading')) {
        sessionStorage.setItem('loginState', 'f'.repeat(64));
      }
    });
    await page.goto('/login');
    await page.getByTestId('login-provider-mock').click();

    await page.waitForURL('/login/error');
    await expect(page.getByText('Something went wrong with your login attempt.')).toBeVisible();
    expect(authentications).toBe(0);
    expect(await storedState(page)).toBeNull();
  });

  test('A callback in a tab whose login state is gone starts the login again', async ({ page }) => {
    await page.addInitScript(() => {
      if (location.pathname.startsWith('/login/loading')) {
        sessionStorage.removeItem('loginState');
        sessionStorage.setItem('redirect', '/explorer?search=age');
      }
    });
    await page.goto('/login');
    await page.getByTestId('login-provider-mock').click();

    await expect(page).toHaveURL(
      '/login?redirectTo=%2Fexplorer%3Fsearch%3Dage&reason=login_restart',
    );
    await expect(page.getByTestId('toast-root')).toContainText(restartToast);
    expect(authentications).toBe(0);
  });

  test('A callback opened in a tab that started no login starts the login again', async ({
    page,
  }) => {
    // The fixture records an AUTH0 login in every tab; a new tab has none.
    await page.addInitScript(() => sessionStorage.removeItem('type'));

    await page.goto('/login/loading/?code=abc123&state=' + 'f'.repeat(64)).catch(() => {});

    await expect(page).toHaveURL('/login?redirectTo=%2F&reason=login_restart');
    await expect(page.getByTestId('toast-root')).toContainText(restartToast);
    expect(authentications).toBe(0);
  });
});

test.describe('Login redirect preserves search state', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    await mockApiSuccess(page, '*/**/psama/authentication', picsureUser);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: mockConsents });
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
    await expect(page.getByTestId('ui-search-input')).toHaveValue('somedata');
    await expect(page.locator('table')).toBeVisible();
  });

  test('A redirectTo that matches no route falls back to the home page', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Login callback simulation is chromium-only, see setup.ts',
    );

    // Given: login was started from a page that no longer exists
    await page.addInitScript(() => {
      sessionStorage.setItem('redirect', '/no-such-route?x=1');
      sessionStorage.setItem('type', 'AUTH0');
    });
    const droppedRedirectLog = page.waitForRequest(
      (request) =>
        request.url().endsWith('/api/v1/log') &&
        (request.postData() ?? '').includes('login.redirect_dropped'),
    );

    // When: login completes
    await page
      .goto(
        '/login/loading/#access_token=' +
          mockToken +
          '&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G',
      )
      .catch(() => {});

    // Then: goto() rejects the stale path, and the user lands home with the drop logged
    await page.waitForURL('/');
    expect((await droppedRedirectLog).postData()).toContain('/no-such-route');
  });
});

test.describe('Login with the terms of service enforced', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  const loginCallback =
    '/login/loading/#access_token=' +
    mockToken +
    '&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G';

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Login callback simulation is chromium-only, see setup.ts',
    );
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_TOS', value: 'true' },
        { name: 'ENFORCE_TOS_ACCEPT', value: 'true' },
      ],
    });
    await page.addInitScript(() => sessionStorage.setItem('type', 'AUTH0'));
    await mockApiSuccess(page, '*/**/picsure/hpds/auth/query/sync', 99);
    await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: mockConsents });
    await page.route(searchResultPath, (route: Route) => route.fulfill({ json: searchResults }));
    await page.route(facetResultPath, (route: Route) => route.fulfill({ json: facetsResponse }));
  });

  test('A user who has not accepted the terms is held by them after login', async ({ page }) => {
    // Given: PSAMA's login response sends the flag as a string
    const notAccepted = { ...picsureUser, acceptedTOS: 'false' };
    await mockApiSuccess(page, '*/**/psama/authentication', notAccepted);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', notAccepted);

    // When
    await page.goto(loginCallback).catch(() => {});

    // Then
    await page.waitForURL('/');
    await expect(page.getByTestId('terms-accept')).toBeVisible();
    await expect(page.getByTestId('ui-modal-close')).not.toBeVisible();
  });

  test('An accepted user is not shown the terms while logging in', async ({ page }) => {
    // Given
    let termsRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('/psama/tos/latest')) termsRequested = true;
    });
    await mockApiSuccess(page, '*/**/psama/authentication', picsureUser);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', picsureUser);
    await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);

    // When
    await page.goto(loginCallback).catch(() => {});

    // Then: the dialog loads the terms whenever it opens
    await page.waitForURL('/');
    await userIsLoggedIn(page);
    expect(termsRequested).toBe(false);
  });

  test('An accepted user PSAMA refuses for another reason is signed out', async ({ page }) => {
    // Given: an empty 403, which PSAMA also sends for an ended session
    await mockApiSuccess(page, '*/**/psama/authentication', picsureUser);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', picsureUser);
    await page.route('*/**/psama/user/me', (route) => route.fulfill({ status: 403, body: '' }));
    await mockApiSuccess(page, '*/**/psama/logout', {});

    // When
    await page.goto(loginCallback).catch(() => {});

    // Then
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    await expect(page.getByTestId('terms-accept')).not.toBeVisible();
  });

  test.describe('when PSAMA refuses them until they accept', () => {
    const storedToken = (page: Page) => page.evaluate(() => localStorage.getItem('token'));

    test.beforeEach(async ({ page }) => {
      const notAccepted = { ...picsureUser, acceptedTOS: 'false' };
      await mockApiSuccess(page, '*/**/psama/authentication', notAccepted);
      await mockApiSuccess(page, '*/**/psama/authentication/auth0', notAccepted);
      await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
      await mockTermsNotAccepted(page);
    });

    test('The landing page holds them with the terms until they accept', async ({ page }) => {
      // Given
      let consentsRequested = false;
      page.on('request', (request) => {
        if (request.url().includes('/psama/user/me/consents')) consentsRequested = true;
      });

      // When
      await page.goto(loginCallback).catch(() => {});

      // Then: the stats load without asking PSAMA for consents it refuses
      await page.waitForURL('/');
      await expect(page.getByTestId('terms-accept')).toBeVisible();
      await expect(page.getByTestId(/^landing-stat-auth-/).first()).toBeVisible();
      expect(consentsRequested).toBe(false);

      // When
      await page.getByTestId('terms-accept').click();

      // Then
      await expect(page.locator('#terms-of-service')).not.toBeVisible();
      await userIsLoggedIn(page);
      await expect(page).toHaveURL('/');
      expect(await storedToken(page)).toBe(mockToken);
    });

    test('An authorized page they return to holds them with the terms', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/operations/dataset/named', datasets);
      await page.addInitScript(() => sessionStorage.setItem('redirect', '/dataset'));

      // When
      await page.goto(loginCallback).catch(() => {});

      // Then
      await page.waitForURL('/dataset');
      await expect(page.getByTestId('terms-accept')).toBeVisible();

      // When
      await page.getByTestId('terms-accept').click();

      // Then
      await expect(page.locator('#terms-of-service')).not.toBeVisible();
      await userIsLoggedIn(page);
      await expect(page).toHaveURL('/dataset');
      expect(await storedToken(page)).toBe(mockToken);
    });
  });
});

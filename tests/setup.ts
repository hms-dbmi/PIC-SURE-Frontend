import { picsureUser, mockToken, userTypes } from './mock-data';
import { test, mockApiSuccess } from './custom-context';

// Creates authenticated user contexts for tests using method noted at
// https://playwright.dev/docs/auth

const userFile = (user: string) => `tests/.auth/${user}.json`;

Object.entries(userTypes).forEach(async ([user, userVariation]) => {
  test(`authenticate as ${user}`, async ({ page }) => {
    const userData = { ...picsureUser, ...userVariation };
    const mockLoginResponse =
      '/login/loading/#access_token=' +
      mockToken +
      '&scope=openid%20profile%20email&expires_in=86400&token_type=Bearer&state=mNK7oJ5SLputhCuYrXYh5n4xEVQXhz6G';

    await mockApiSuccess(page, '*/**/psama/authentication', userData);
    await mockApiSuccess(page, '*/**/psama/authentication/auth0', userData);
    await mockApiSuccess(page, '*/**/psama/authentication/fence', userData);
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', userData);
    await mockApiSuccess(page, '*/**/psama/user/me', userData);
    await page.goto(mockLoginResponse);

    // We must accept the Google consent dialog before we can interact with some elements in the page.
    await page.waitForSelector('[data-testid="consentModal"]');
    const acceptConsentButton = page.getByTestId('acceptGoogleConsent');
    await acceptConsentButton.click();

    await page.waitForURL('/');

    await page.context().storageState({ path: userFile(user) });
  });
});

test('unauthenticated user', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="consentModal"]');
  const acceptConsentButton = page.getByTestId('acceptGoogleConsent');
  await acceptConsentButton.click();

  await page.waitForURL('/');

  await page.context().storageState({ path: userFile('unauthenticated') });
});

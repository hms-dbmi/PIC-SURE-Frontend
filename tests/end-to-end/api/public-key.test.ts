import { expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';
import { scrollIntoViewAtRest } from '../utils';

const apiKeyPath = '*/**/psama/open/apiKey';
const mockKeyResponse = {
  apiKey: 'picsure_0Zx9AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abc',
  uuid: '0b6cf65e-6f9e-4a3c-9d0e-1f2a3b4c5d6e',
  displayPrefix: '0Zx9AbCd',
  keyType: 'USER',
  expiresAt: '2026-10-11T12:13:14Z',
};

// .env.test bakes a Turnstile sitekey into the build, so the widget is active in every
// test here. Serve a stub api.js instead of Cloudflare's so CI stays hermetic: it issues
// a token immediately, like the real managed widget does for a non-suspicious visitor.
const stubToken = 'XXXX.DUMMY.TOKEN';
async function stubTurnstile(context: BrowserContext) {
  await context.route('**/challenges.cloudflare.com/turnstile/v0/api.js*', (route: Route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile = {
        render: (container, options) => {
          options.callback(${JSON.stringify(stubToken)});
          return 'stub-widget';
        },
        remove: () => {},
      };`,
    }),
  );
}

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

test.beforeEach(async ({ context }) => {
  await stubTurnstile(context);
});

// The open form ends below the fold, so it is brought into view here and the clicks in
// it don't have to scroll.
async function openForm(page: Page) {
  const request = page.getByRole('button', { name: 'Request Public Key' });
  await scrollIntoViewAtRest(page, request);
  await request.click();
  const generate = page.getByRole('button', { name: 'Generate Key' });
  await expect(generate).toBeVisible();
  await scrollIntoViewAtRest(page, generate);
}

test.describe('Public access key generation', () => {
  test.beforeEach(async ({ page }) => {
    // OPEN keeps the root layout from redirecting anonymous visitors to /login.
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
  });

  test('Logged-out api page shows the card with an enabled request button', async ({ page }) => {
    // Given
    await page.goto('/api');

    // When
    const card = page.getByTestId('api-public-key');

    // Then
    await expect(card.getByRole('button', { name: 'Request Public Key' })).toBeEnabled();
    await expect(page.getByTestId('api-login-link')).toHaveAttribute(
      'href',
      '/login?redirectTo=/api',
    );
  });

  test('Generates and reveals a key with copy button and one-time warning', async ({
    page,
    context,
  }) => {
    // Given
    await mockApiSuccess(context, apiKeyPath, mockKeyResponse);
    await page.goto('/api');

    // When
    await openForm(page);
    await page.getByRole('button', { name: 'Generate Key' }).click();

    // Then
    await expect(page.getByTestId('api-public-key-value')).toHaveText(mockKeyResponse.apiKey);
    await expect(page.getByTestId('ui-copy-trigger')).toBeVisible();
    await expect(page.getByTestId('api-public-key-warning')).toContainText(
      'This key is shown only once and cannot be recovered.',
    );
    await expect(page.getByTestId('api-public-key-expires')).not.toBeEmpty();
  });

  test('Sends no Authorization header and the Turnstile token', async ({ page, context }) => {
    // Given
    let headers: Record<string, string> | undefined;
    let body: string | null | undefined;
    await context.route(apiKeyPath, async (route: Route) => {
      headers = route.request().headers();
      body = route.request().postData();
      await route.fulfill({ json: mockKeyResponse });
    });
    await page.goto('/api');

    // When
    await openForm(page);
    await page.getByLabel('Email (optional)').fill('researcher@example.org');
    await page.getByRole('button', { name: 'Generate Key' }).click();
    await expect(page.getByTestId('api-public-key-value')).toBeVisible();

    // Then
    expect(headers?.['authorization']).toBeUndefined();
    expect(headers?.['request-source']).toBe('Open');
    expect(JSON.parse(body || '{}')).toEqual({
      captchaToken: stubToken,
      name: null,
      email: 'researcher@example.org',
    });
  });

  test('Shows an inline error on failure and allows retry', async ({ page, context }) => {
    // Given
    await context.route(apiKeyPath, (route: Route) =>
      route.fulfill({
        status: 400,
        contentType: 'text/plain',
        body: 'Public key generation is not enabled.',
      }),
    );
    await page.goto('/api');

    // When
    await openForm(page);
    await page.getByRole('button', { name: 'Generate Key' }).click();

    // Then
    const errorAlert = page.getByTestId('api-public-key').getByTestId('ui-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Public key generation is not enabled.');
    await expect(page.getByTestId('api-public-key-value')).not.toBeVisible();

    // When
    await page.getByRole('button', { name: 'Try Again' }).click();

    // Then
    await expect(page.getByRole('button', { name: 'Generate Key' })).toBeVisible();
  });

  test('Rejects a malformed email without sending a request', async ({ page, context }) => {
    // Given
    let requestCount = 0;
    await context.route(apiKeyPath, async (route: Route) => {
      requestCount++;
      await route.fulfill({ json: mockKeyResponse });
    });
    await page.goto('/api');
    await openForm(page);

    // When: type="email" catches shapes like "not-an-email"; the pattern attribute
    // additionally requires a dot in the domain, which type="email" alone allows
    const emailField = page.getByLabel('Email (optional)');
    for (const invalid of ['not-an-email', 'name@nodot']) {
      await emailField.fill(invalid);
      await page.getByRole('button', { name: 'Generate Key' }).click();

      // Then: native constraint validation blocks submission
      await expect(emailField).toHaveJSProperty('validity.valid', false);
      await expect(page.getByTestId('api-public-key-value')).not.toBeVisible();
    }
    expect(requestCount).toBe(0);

    // When: a well-formed email passes
    await emailField.fill('researcher@example.org');
    await page.getByRole('button', { name: 'Generate Key' }).click();

    // Then
    await expect(page.getByTestId('api-public-key-value')).toBeVisible();
    expect(requestCount).toBe(1);
  });

  test('Cancel returns to the idle state without a request', async ({ page, context }) => {
    // Given
    let requestCount = 0;
    await context.route(apiKeyPath, async (route: Route) => {
      requestCount++;
      await route.fulfill({ json: mockKeyResponse });
    });
    await page.goto('/api');

    // When
    await openForm(page);
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Then
    await expect(page.getByRole('button', { name: 'Request Public Key' })).toBeEnabled();
    await expect(page.getByTestId('api-public-key-value')).not.toBeVisible();
    expect(requestCount).toBe(0);
  });
});

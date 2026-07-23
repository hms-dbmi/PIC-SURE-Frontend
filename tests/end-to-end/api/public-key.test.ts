import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';

const apiKeyPath = '*/**/psama/open/apiKey';
const mockKeyResponse = {
  apiKey: 'picsure_0Zx9AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abc',
  uuid: '0b6cf65e-6f9e-4a3c-9d0e-1f2a3b4c5d6e',
  displayPrefix: '0Zx9AbCd',
  keyType: 'USER',
  expiresAt: '2026-10-11T12:13:14Z',
};

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

// Clicks that land before Svelte hydration are silently dropped, so retry until the form opens
async function openForm(page: Page) {
  await expect(async () => {
    await page.getByRole('button', { name: 'Request Public Key' }).click({ timeout: 2000 });
    await expect(page.getByRole('button', { name: 'Generate Key' })).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
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
    const card = page.getByTestId('public-access-key');

    // Then
    await expect(card).toBeVisible();
    await expect(card).toContainText('Public Access Key');
    await expect(card).toContainText('No account required');
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
    await expect(page.getByTestId('public-key-value')).toHaveText(mockKeyResponse.apiKey);
    await expect(page.getByTestId('copy-btn')).toBeVisible();
    await expect(page.getByTestId('public-key-warning')).toContainText(
      'This key is shown only once and cannot be recovered.',
    );
    await expect(page.getByTestId('public-key-expires')).not.toBeEmpty();
  });

  test('Sends no Authorization header and a null captcha token', async ({ page, context }) => {
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
    // A token appearing in localStorage after load (login in another tab, leftover expired
    // token) must NOT be attached: api.ts reads localStorage at request time and a stale
    // token 401s this public endpoint server-side. Set it only after the form is open —
    // if hydration sees the token first, the page renders logged-in and the form never exists.
    await page.evaluate(() => localStorage.setItem('token', 'stale.jwt.value'));
    await page.getByLabel('Email (optional)').fill('researcher@example.org');
    await page.getByRole('button', { name: 'Generate Key' }).click();
    await expect(page.getByTestId('public-key-value')).toBeVisible();

    // Then
    expect(headers?.['authorization']).toBeUndefined();
    expect(headers?.['request-source']).toBe('Open');
    expect(JSON.parse(body || '{}')).toEqual({
      captchaToken: null,
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
    const errorAlert = page.getByTestId('public-access-key').getByTestId('error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Public key generation is not enabled.');
    await expect(page.getByTestId('public-key-value')).not.toBeVisible();

    // When
    await page.getByRole('button', { name: 'Try Again' }).click();

    // Then
    await expect(page.getByRole('button', { name: 'Generate Key' })).toBeVisible();
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
    await expect(page.getByTestId('public-key-value')).not.toBeVisible();
    expect(requestCount).toBe(0);
  });
});

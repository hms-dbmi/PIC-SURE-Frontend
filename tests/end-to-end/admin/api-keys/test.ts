import { expect, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiSuccessByMethod } from '../../custom-context';
import { userIsLoggedIn } from '../../utils';
import type { ApiKeyMetadata } from '../../../../src/lib/models/ApiKey';

const FAKE_KEY = 'picsure_FAKE-TEST-FIXTURE-VALUE-0000000000000000000';

const activeKey: ApiKeyMetadata = {
  uuid: 'uuid-active',
  displayPrefix: 'abc12345',
  keyType: 'USER',
  name: 'Alice',
  email: 'alice@example.org',
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  revokedAt: null,
  lastUsedAt: '2026-06-01T00:00:00Z',
};

const revokedKey: ApiKeyMetadata = {
  uuid: 'uuid-revoked',
  displayPrefix: 'def67890',
  keyType: 'PLATFORM',
  name: 'Pipeline',
  email: 'ops@example.org',
  createdAt: '2026-02-01T00:00:00Z',
  expiresAt: null,
  revokedAt: '2026-03-01T00:00:00Z',
  lastUsedAt: null,
};

const expiredKey: ApiKeyMetadata = {
  uuid: 'uuid-expired',
  displayPrefix: 'ghi13579',
  keyType: 'USER',
  name: null,
  email: null,
  createdAt: '2025-01-01T00:00:00Z',
  expiresAt: '2025-06-01T00:00:00Z',
  revokedAt: null,
  lastUsedAt: null,
};

const keyPage = (keys: ApiKeyMetadata[]) => ({
  keys,
  totalCount: keys.length,
  page: 0,
  size: 10,
});

const mintedResponse = {
  apiKey: FAKE_KEY,
  uuid: 'uuid-new',
  displayPrefix: 'zzz99999',
  keyType: 'PLATFORM',
  expiresAt: null,
};

test.use({ storageState: 'tests/end-to-end/.auth/superUser.json' });

test.beforeEach(async ({ context }) => {
  await mockApiSuccess(context, '*/**/psama/apiKey*', keyPage([activeKey, revokedKey, expiredKey]));
});

test.describe('api keys list', () => {
  test('Displays keys with masked prefix, type, and derived status', async ({ page }) => {
    // Given
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // Then
    const table = page.getByTestId('ApiKeys-table');
    await expect(table).toContainText('picsure_abc12345…');
    await expect(table).toContainText('picsure_def67890…');
    await expect(table).toContainText('picsure_ghi13579…');
    await expect(table).toContainText('PLATFORM');
    await expect(table).toContainText('Active');
    await expect(table).toContainText('Revoked');
    await expect(table).toContainText('Expired');
  });

  test('Shows the server total in the table footer', async ({ page }) => {
    // Given
    await page.route('*/**/psama/apiKey*', (route: Route) =>
      route.fulfill({ json: { ...keyPage([activeKey]), totalCount: 42 } }),
    );
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('.table-wrap footer')).toContainText('42');
  });

  test('Only active keys have a revoke button', async ({ page }) => {
    // Given
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('api-key-uuid-active-revoke-btn')).toBeVisible();
    await expect(page.getByTestId('api-key-uuid-revoked-revoke-btn')).toHaveCount(0);
    await expect(page.getByTestId('api-key-uuid-expired-revoke-btn')).toHaveCount(0);
  });
});

test.describe('revoke flow', () => {
  test('Revoking requires confirmation and refreshes the list', async ({ page }) => {
    // Given
    let revoked = false;
    await page.route('*/**/psama/apiKey*', (route: Route) =>
      route.fulfill({
        json: keyPage([revoked ? { ...activeKey, revokedAt: '2026-07-14T00:00:00Z' } : activeKey]),
      }),
    );
    await page.route('*/**/psama/apiKey/*/revoke', (route: Route) => {
      revoked = true;
      return route.fulfill({ json: { ...activeKey, revokedAt: '2026-07-14T00:00:00Z' } });
    });
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('api-key-uuid-active-revoke-btn').click();
    const dialog = page.getByTestId('api-key-uuid-active-revoke');
    await expect(dialog).toContainText('permanent and cannot be undone');
    const putRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' && request.url().includes('/psama/apiKey/uuid-active/revoke'),
    );
    await dialog.getByRole('button', { name: 'Revoke' }).click();

    // Then
    await putRequest;
    await expect(page.getByTestId('ApiKeys-table')).toContainText('Revoked');
    await expect(page.getByTestId('api-key-uuid-active-revoke-btn')).toHaveCount(0);
  });

  test('Cancelling the confirmation does not revoke', async ({ page }) => {
    // Given
    let putCalled = false;
    await page.route('*/**/psama/apiKey/*/revoke', (route: Route) => {
      putCalled = true;
      return route.fulfill({ json: activeKey });
    });
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('api-key-uuid-active-revoke-btn').click();
    const dialog = page.getByTestId('api-key-uuid-active-revoke');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Then
    await expect(dialog).not.toBeVisible();
    expect(putCalled).toBe(false);
  });
});

test.describe('mint platform key flow', () => {
  test('Minting reveals the key exactly once with a see-once warning', async ({ page }) => {
    // Given
    await mockApiSuccessByMethod(page, '*/**/psama/apiKey/platform', 'POST', mintedResponse);
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('mint-platform-key-btn').click();
    await page.getByLabel(/name/i).fill('CI Pipeline');
    await page.getByLabel(/email/i).fill('ops@example.org');
    await page.getByRole('button', { name: 'Mint Key' }).click();

    // Then
    const reveal = page.getByTestId('mint-key-reveal');
    await expect(reveal).toBeVisible();
    await expect(reveal.getByTestId('minted-api-key')).toHaveText(FAKE_KEY);
    // the modal portals its content, so locate the warning by test id rather than a scoped role
    await expect(page.getByTestId('minted-key-warning')).toContainText(/shown only once/i);
    // No accidental dismissal: no close button, and Escape does not close it
    await expect(reveal.getByTestId('modal-close-button')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(reveal.getByTestId('minted-api-key')).toBeVisible();

    // When
    await reveal.getByTestId('acknowledge-minted-key').click();

    // Then
    await expect(page.getByTestId('minted-api-key')).toHaveCount(0);
  });

  test('Sends the expiry date as a UTC instant', async ({ page }) => {
    // Given
    await mockApiSuccessByMethod(page, '*/**/psama/apiKey/platform', 'POST', mintedResponse);
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('mint-platform-key-btn').click();
    await page.getByLabel(/name/i).fill('CI Pipeline');
    await page.getByLabel(/email/i).fill('ops@example.org');
    await page.getByLabel(/expiration date/i).fill('2099-01-01');
    const postRequest = page.waitForRequest(
      (request) => request.method() === 'POST' && request.url().includes('/psama/apiKey/platform'),
    );
    await page.getByRole('button', { name: 'Mint Key' }).click();

    // Then
    const request = await postRequest;
    expect(request.postDataJSON()).toEqual({
      name: 'CI Pipeline',
      email: 'ops@example.org',
      expiresAt: '2099-01-01T00:00:00Z',
    });
  });

  test('Shows the backend message inline when minting fails', async ({ page }) => {
    // Given
    await page.route('*/**/psama/apiKey/platform', (route: Route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ errorType: 'error', message: 'Expiry must be in the future' }),
      }),
    );
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('mint-platform-key-btn').click();
    await page.getByLabel(/name/i).fill('CI Pipeline');
    await page.getByLabel(/email/i).fill('ops@example.org');
    await page.getByRole('button', { name: 'Mint Key' }).click();

    // Then
    await expect(page.getByTestId('mint-key-error')).toContainText('Expiry must be in the future');
    await expect(page.getByTestId('mint-key-reveal')).toHaveCount(0);
  });

  test('Enforces required name and email', async ({ page }) => {
    // Given
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('mint-platform-key-btn').click();
    await page.getByRole('button', { name: 'Mint Key' }).click();

    // Then
    const invalid = await page
      .getByLabel(/name/i)
      .evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(invalid).toMatch(/([Pp]lease )?[Ff]ill out this field.?/);
  });
});

test.describe('Admin on API Keys page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/adminUser.json' });

  test('Mint and revoke are disabled when not top admin', async ({ page }) => {
    // Given
    await page.goto('/admin/api-keys');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
    await expect(page.getByTestId('mint-platform-key-btn')).toBeDisabled();
    await expect(page.getByTestId('api-key-uuid-active-revoke-btn')).toBeDisabled();
  });
});

import { expect, type Route } from '@playwright/test';
import { test } from '../../custom-context';
import { branding } from '../../../src/lib/configuration';
import { user as mockUser } from '../../../tests/mock-data';

const placeHolderDots =
  '•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';

test.describe('API page', () => {
  test('Has expected error message', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) => route.abort('accessdenied'));
    await page.goto('/api');
    // When
    const errorAlert = page.locator('[data-testid=error-alert]');
    // Then
    await expect(errorAlert).toBeVisible();
  });
  branding.apiPage.cards.forEach((card) => {
    test(`Has expect card, ${card.header} from branding`, async ({ page }) => {
      // Given
      await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
        route.fulfill({ json: mockUser }),
      );
      await page.goto('/api');
      // When
      const cardTitle = page.getByText(card.header);
      const cardBody = page.getByText(card.body);
      // Then
      await expect(cardTitle).toBeVisible();
      await expect(cardBody).toBeVisible();
    });
  });
  test('Has expected content', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');

    // When
    const userToken = page.locator('#user-token');

    // Then
    await expect(userToken).toBeVisible();
  });
  test('Has expected badge and expiration', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const expires = page.locator('#expires');
    const badge = page.locator('#expires-badge');

    // Then
    await expect(expires).toBeVisible();
    await expect(badge).toBeVisible();
    expect(await badge.innerText()).toBe('EXPIRED');
    expect(await expires.innerText()).toContain('Mon Feb 01 2021');
  });
  test(`User account matches expected email of ${mockUser.email}`, async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const userEmail = page.locator('#account');
    // Then
    await expect(userEmail).toBeVisible();
    expect(await userEmail.innerText()).toBe(mockUser.email);
  });
  test('Token is hidden by default', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const userToken = page.locator('#token');
    // Then
    await expect(userToken).toBeVisible();
    expect(await userToken.innerText()).toBe(placeHolderDots);
  });
  test('Buttons are displayed', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const copyButton = page.getByTestId('copy-button');
    const refeshButton = page.locator('#refresh-button');
    const revealButton = page.locator('#reveal-button');
    // Then
    await expect(copyButton).toBeVisible();
    await expect(refeshButton).toBeVisible();
    await expect(revealButton).toBeVisible();
  });
  test('Copy button copies token to clipboard', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');

    // When
    const copyButton = page.getByTestId('copy-button');

    // Then
    await expect(copyButton).toBeVisible();
    expect((await copyButton.innerHTML()).toString()).toBe('Copy');

    // When
    await copyButton.click();

    // Then
    expect((await copyButton.innerHTML()).toString()).toBe('Copied!');
    //expect(await page.evaluate(() => navigator.clipboard.readText())).toEqual(mockUser.token);
  });
  test('Token is visible when reveal button is clicked', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const revealButton = page.locator('#reveal-button');
    await revealButton.click();
    const userToken = page.locator('#token');
    // Then
    await expect(userToken).toBeVisible();
    expect(await userToken.innerText()).toBe(mockUser.token);
  });
  test('Reveal button text changes when clicked', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const revealButton = page.locator('#reveal-button');
    await revealButton.click();
    // Then
    expect((await revealButton.innerHTML()).toString()).toBe('Hide');
  });
  test('Refresh button changes token', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.goto('/api');
    // When
    const refreshButton = page.locator('#refresh-button');
    const userToken = page.locator('#token');
    await refreshButton.click();
    // Then
    expect(await userToken.innerText()).not.toBe(mockUser.token);
  });
  test('Refresh button changes expiration, updates button text, disables button', async ({
    page,
  }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.route('*/**/psama/user/me/refresh_long_term_token', (route: Route) =>
      route.fulfill({ json: { userLongTermToken: 'new longterm token' } }),
    );
    await page.goto('/api');
    // When
    const userToken = page.locator('#token');
    const refreshButton = page.locator('#refresh-button');
    const expires = page.locator('#expires');
    await refreshButton.click();
    // Confirm Modal pops up
    const confrimButton = page.locator('button:has-text("Confirm")');
    await confrimButton.click();
    // Confirm Modal closes and now reveal new token
    const revealButton = page.locator('#reveal-button');
    await revealButton.click();
    // Then
    await expect(refreshButton).toHaveText('Refreshed!');
    await expect(refreshButton).toBeDisabled();
    expect(await userToken.innerText()).not.toBe(placeHolderDots);
    expect(await userToken.innerText()).toBe('new longterm token');
    expect(await expires.innerText()).not.toContain('Mon Feb 01 2021');
  });
  test('Canceling confirm modal does nothing to user', async ({ page }) => {
    // Given
    await page.route('*/**/psama/user/me?hasToken', (route: Route) =>
      route.fulfill({ json: mockUser }),
    );
    await page.route('*/**/psama/user/me/refresh_long_term_token', (route: Route) =>
      route.fulfill({ json: { userLongTermToken: 'new longterm token' } }),
    );
    await page.goto('/api');
    // When
    const userToken = page.locator('#token');
    const refreshButton = page.locator('#refresh-button');
    const expires = page.locator('#expires');
    await refreshButton.click();
    // Confirm Modal pops up
    const cancel = page.locator('button:has-text("Cancel")');
    await cancel.click();
    // Then
    await expect(refreshButton).toHaveText('Refresh');
    await expect(refreshButton).not.toBeDisabled();
    expect(await userToken.innerText()).toBe(placeHolderDots);
    expect(await expires.innerText()).toContain('Mon Feb 01 2021');
  });
});

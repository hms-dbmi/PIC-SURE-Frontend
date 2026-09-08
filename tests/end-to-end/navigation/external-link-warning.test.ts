import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import { userIsLoggedIn } from '../utils';
import type { Branding } from '../../../src/lib/models/Configuration';
import { Internal } from '../../../src/lib/paths';
import * as config from '../../../src/lib/assets/configuration.json' with { type: 'json' };

//TypeScript is confused by the JSON import so I am fixing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));
const externalLink = branding.footer.links.find((link) => link.newTab && /^https?:/.test(link.url));
if (!externalLink) throw new Error('Expected an external newTab link in footer config');
const expectedTitle = branding.externalLinkWarning?.title || `Leaving ${branding.applicationName}`;

// Collects the actions of every external_link log POST the page fires. Reading them off
// the request (rather than the response) keeps the confirm log visible even when a
// same-tab navigation tears the request down before it completes.
function collectExternalLinkLogs(page: Page): string[] {
  const actions: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.url().includes(Internal.Log)) return;
    const action = JSON.parse(request.postData() || '{}').action;
    if (typeof action === 'string' && action.startsWith('external_link.')) actions.push(action);
  });
  return actions;
}

test.describe('External link warning', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [{ name: 'CONFIRM_EXTERNAL_NAVIGATION', value: 'true' }],
    });
  });

  test('Clicking an external footer link opens the warning modal instead of navigating', async ({
    page,
  }) => {
    // Given
    await page.goto('/');
    await userIsLoggedIn(page);
    // When
    await page.locator('#main-footer').getByRole('link', { name: externalLink.title }).click();
    // Then
    const modal = page.getByTestId('external-link-warning');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(expectedTitle);
    await expect(page).toHaveURL('/');
  });

  test('Cancel closes the modal and stays on the page', async ({ page }) => {
    // Given
    await page.goto('/');
    await userIsLoggedIn(page);
    await page.locator('#main-footer').getByRole('link', { name: externalLink.title }).click();
    // When
    await page
      .getByRole('button', { name: branding.externalLinkWarning?.cancelText || 'Cancel' })
      .click();
    // Then
    await expect(page.getByTestId('external-link-warning')).not.toBeVisible();
    await expect(page).toHaveURL('/');
    expect(page.context().pages().length).toBe(1);
  });

  test('OK opens the external site in a new tab', async ({ page }) => {
    // Given
    const externalOrigin = new URL(externalLink.url).origin;
    await page.context().route(`${externalOrigin}/**`, (route) =>
      route.fulfill({
        body: '<html><body>external stub</body></html>',
        contentType: 'text/html',
      }),
    );
    await page.goto('/');
    await userIsLoggedIn(page);
    await page.locator('#main-footer').getByRole('link', { name: externalLink.title }).click();
    // When
    // The new tab is opened with noopener, so wait on the context, not a page popup event
    const newPagePromise = page.context().waitForEvent('page');
    await page.getByRole('button', { name: branding.externalLinkWarning?.okText || 'OK' }).click();
    // Then
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toBe(externalLink.url);
    await expect(page.getByTestId('external-link-warning')).not.toBeVisible();
  });

  // Confirming used to log external_link.confirmed and then external_link.cancelled in
  // Firefox, whose window.open() spins the event loop mid-navigation (ALS-12908).
  test('OK logs a single confirmation and no cancellation', async ({ page }) => {
    // Given
    const externalOrigin = new URL(externalLink.url).origin;
    await page.context().route(`${externalOrigin}/**`, (route) =>
      route.fulfill({
        body: '<html><body>external stub</body></html>',
        contentType: 'text/html',
      }),
    );
    const logged = collectExternalLinkLogs(page);
    await page.goto('/');
    await userIsLoggedIn(page);
    await page.locator('#main-footer').getByRole('link', { name: externalLink.title }).click();
    // When
    const newPagePromise = page.context().waitForEvent('page');
    await page.getByRole('button', { name: branding.externalLinkWarning?.okText || 'OK' }).click();
    // Then
    await (await newPagePromise).waitForLoadState();
    await expect(page.getByTestId('external-link-warning')).not.toBeVisible();
    expect(logged).toEqual(['external_link.warning_shown', 'external_link.confirmed']);
  });

  // Same-tab confirms send the log while the browser is already tearing the page down,
  // so it only survives because logger sends it with keepalive (ALS-12908).
  test('OK logs the confirmation for a same-tab external link', async ({ page }) => {
    // Given
    // Every external link in the footer config opens in a new tab, so add one that does
    // not - the same-tab path is the one that races the page teardown.
    const sameTabUrl = 'https://external-same-tab.example.com/page';
    await page.context().route(`${new URL(sameTabUrl).origin}/**`, (route) =>
      route.fulfill({
        body: '<html><body>external stub</body></html>',
        contentType: 'text/html',
      }),
    );
    const logged = collectExternalLinkLogs(page);
    await page.goto('/');
    await userIsLoggedIn(page);
    await page.evaluate((url) => {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.id = 'same-tab-external-link';
      anchor.textContent = 'same tab external link';
      document.body.appendChild(anchor);
    }, sameTabUrl);
    await page.locator('#same-tab-external-link').click();
    await expect(page.getByTestId('external-link-warning')).toBeVisible();
    // When
    await page.getByRole('button', { name: branding.externalLinkWarning?.okText || 'OK' }).click();
    // Then
    await page.waitForURL(sameTabUrl);
    expect(logged).toEqual(['external_link.warning_shown', 'external_link.confirmed']);
  });

  test('Internal navigation does not trigger the warning', async ({ page }) => {
    // Given
    await page.goto('/');
    await userIsLoggedIn(page);
    // When
    await page.locator('#nav-link-help').click();
    // Then
    await expect(page).toHaveURL('/help');
    await expect(page.getByTestId('external-link-warning')).not.toBeVisible();
  });
});

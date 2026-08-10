import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import { userIsLoggedIn } from '../utils';
import type { Branding } from '../../../src/lib/models/Configuration';
import * as config from '../../../src/lib/assets/configuration.json' with { type: 'json' };

//TypeScript is confused by the JSON import so I am fixing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));
const externalLink = branding.footer.links.find((link) => link.newTab && /^https?:/.test(link.url));
if (!externalLink) throw new Error('Expected an external newTab link in footer config');
const expectedTitle = branding.externalLinkWarning?.title || `Leaving ${branding.applicationName}`;

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

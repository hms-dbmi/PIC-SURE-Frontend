import { expect, type Route, type Page } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { searchResults as mockSearchResults, facetsResponse } from '../../../mock-data';

import type { Branding } from '../../../../src/lib/configuration';
import * as config from '../../../../src/lib/assets/configuration.json' assert { type: 'json' };
//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));

const Terms: { [key: string]: string } = { _: '*/**/psama/tos' };
Terms.Latest = Terms._ + '/latest';
Terms.Accept = Terms._ + '/accept';

const MODAL_DISMISS_TIMEOUT = 100;

const mockTerms = '<h1>Terms of Service</h1><p>Please accept the terms to use this site.</p>';

export function mockHTMLBody(context: Page, path: string, body: string) {
  return context.route(path, async (route: Route) => route.fulfill({ body }));
}

test.describe('Not logged in', () => {
  test('Terms do not open when user is not logged in', async ({ page }) => {
    // When
    await page.goto('/');

    // Then
    expect(page.locator('#terms-of-service')).not.toBeVisible();
  });
  test('Terms link displays close button', async ({ page }) => {
    // Given
    mockHTMLBody(page, Terms.Latest, mockTerms);
    await page.goto('/');

    // When
    await page.getByTestId('terms-of-service-btn').click();
    await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

    // Then
    expect(page.locator('#terms-of-service')).toBeVisible();
    expect(page.getByTestId('modal-close-button')).toBeVisible();
  });
  test('Terms link opens dismissable modal', async ({ page }) => {
    // Given
    mockHTMLBody(page, Terms.Latest, mockTerms);
    await page.goto('/');
    await page.getByTestId('terms-of-service-btn').click();
    await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

    // When
    await page.keyboard.press('Escape');
    await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

    // Then
    expect(page.locator('#terms-of-service')).not.toBeVisible();
  });
});

test.describe('Logged in', () => {
  let tosLatestRequest = false;
  let tosAcceptRequest = false;
  // let tosUpdateRequest = false;

  test.beforeEach(({ page }) => {
    mockApiSuccess(page, '*/**/picsure/query/sync', 99);
    mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/concepts*', mockSearchResults);
    mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/facets', facetsResponse);
    mockHTMLBody(page, Terms.Latest, mockTerms);
    page.on('request', (request) => {
      if (request.url().includes('/psama/tos/latest')) {
        tosLatestRequest = true;
      } else if (request.url().includes('/psama/tos/accept')) {
        tosAcceptRequest = true;
      } /* else if (request.url().includes('/psama/tos') && request.method() === 'POST') {
        tosUpdateRequest = true;
      }*/
    });
  });

  test.afterEach(() => {
    tosLatestRequest = false;
    tosAcceptRequest = false;
    // tosUpdateRequest = false;
  });

  test.describe('Terms prompt', () => {
    test.use({ storageState: 'tests/.auth/noTOS.json' });

    test('The TOS modal opens and requests terms html data', async ({ page }) => {
      // When
      await page.goto('/');

      // Then
      expect(tosLatestRequest).toBeTruthy();
      expect(page.locator('#terms-of-service')).toBeVisible();
    });
    test('Modal does not allow user to dismiss it', async ({ page }) => {
      // Given
      await page.goto('/');

      // When
      await page.keyboard.press('Escape');

      // Then
      expect(page.locator('#terms-of-service')).toBeVisible();
      expect(page.getByTestId('modal-close-button')).not.toBeVisible();
    });
    test('Clicking the accept sends request', async ({ page }) => {
      // Given
      mockApiSuccess(page, Terms.Accept, '');
      await page.goto('/');

      // When
      await page.getByTestId('terms-accept-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // Then
      expect(tosAcceptRequest).toBeTruthy();
      expect(page.locator('#terms-of-service')).not.toBeVisible({ timeout: 10000 });
    });
    test('Clicking the reject redirects the user', async ({ page }) => {
      // Given
      mockHTMLBody(
        page,
        branding.termsOfService.rejectionUrl,
        '<h1>Some Rejection Information Page</h1>',
      );
      await page.goto('/');

      // When
      await page.getByTestId('terms-reject-btn').click();

      // Then
      const rejectionUrl = RegExp('^' + branding.termsOfService.rejectionUrl);
      await expect(page).toHaveURL(rejectionUrl);
    });
    test('TOS modal has close button after acceptance', async ({ page }) => {
      // Given
      mockApiSuccess(page, Terms.Accept, '');
      await page.goto('/');
      await page.getByTestId('terms-accept-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // When
      await page.getByTestId('terms-of-service-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // Then
      expect(page.locator('#terms-of-service')).toBeVisible();
      expect(page.getByTestId('modal-close-button')).toBeVisible();
    });
    test('TOS modal is dismissable after acceptance', async ({ page }) => {
      // Given
      mockApiSuccess(page, Terms.Accept, '');
      await page.goto('/');
      await page.getByTestId('terms-accept-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);
      await page.getByTestId('terms-of-service-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // When
      await page.keyboard.press('Escape');
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // Then
      expect(page.locator('#terms-of-service')).not.toBeVisible();
    });
    test('Terms API error is gracefully handled', () => {
      throw new Error('not implemented');
    });
  });

  //   test.describe('Terms edit', () => {
  //     test.use({ storageState: 'tests/.auth/superUser.json' });

  //     test('Superuser can navigate to terms of service configuration page', async ({ page }) => {});
  //     test('Commit button is disabled when no changes are made', async ({ page }) => {});
  //     test('Commit button is enabeld on content change', async ({ page }) => {});
  //     test('Confirmation modal appears on commit', async ({ page }) => {});
  //     test('Cancel button does not submit update', async ({ page }) => {});
  //     test('Confirm button submits updated terms', async ({ page }) => {});
  //   });
});

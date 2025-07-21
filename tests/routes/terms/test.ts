import { expect, type Route, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../../custom-context';
import {
  searchResults as mockSearchResults,
  facetsResponse,
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
} from '../../mock-data';

import type { Branding } from '../../../src/lib/configuration';
import * as config from '../../../src/lib/assets/configuration.json' assert { type: 'json' };

//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));

const Terms: { [key: string]: string } = { Root: '*/**/psama/tos' };
Terms.Latest = Terms.Root + '/latest';
Terms.Accept = Terms.Root + '/accept';

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
  let tosUpdateRequest = false;

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
      } else if (request.url().includes('/psama/tos') && request.method() === 'POST') {
        tosUpdateRequest = true;
      }
    });
  });

  test.afterEach(() => {
    tosLatestRequest = false;
    tosAcceptRequest = false;
    tosUpdateRequest = false;
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
    test('Displays an error box when api fails', async ({ page }) => {
      // Given
      mockApiFail(page, Terms.Latest, 'failed');

      // When
      await page.goto('/');

      // Then
      expect(page.getByTestId('terms-api-error')).toBeVisible();
      expect(page.getByTestId('terms-close-btn')).toBeVisible();
    });
  });

  test.describe('Terms edit', () => {
    test.use({ storageState: 'tests/.auth/superUser.json' });

    test.beforeEach(({ page }) => {
      mockApiSuccess(page, '*/**/psama/role', mockRoles);
      mockApiSuccess(page, '*/**/psama/privilege', mockPrivileges);
      mockApiSuccess(page, '*/**/psama/application', mockApps);
      mockApiSuccess(page, '*/**/psama/connection', mockConnections);
    });

    // test('Admin can navigate to terms of service configuration page', async ({ page }) => {});
    test('Commit button is disabled when no changes are made', async ({ page }) => {
      // When
      await page.goto('/admin/configuration/terms/edit');

      // Then
      expect(page.getByTestId('publish-terms-btn')).toBeDisabled();
    });
    test('Commit button is enabeld on content change', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');

      // When
      await page.locator('#editor div.ql-editor').fill('Some new text');

      // Then
      expect(page.getByTestId('publish-terms-btn')).toBeEnabled();
    });
    test('Confirmation modal appears on commit', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');

      // When
      await page.getByTestId('publish-terms-btn').click();

      // Then
      expect(page.getByTestId('publish-terms')).toBeVisible();
    });
    test('Cancel button does not submit update', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');
      await page.getByTestId('publish-terms-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // When
      await page.getByText('Cancel', { exact: true }).click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // Then
      expect(tosUpdateRequest).toBeFalsy();
      expect(page.getByTestId('publish-terms')).not.toBeVisible();
    });
    test('Confirm button submits updated terms, redirects, and success', async ({ page }) => {
      // Given
      mockHTMLBody(page, Terms.Root, '');
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');
      await page.getByTestId('publish-terms-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // When
      await page.getByText('Confirm', { exact: true }).click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // Then
      const toast = page.getByTestId('toast-root');
      await expect(toast).toBeVisible();
      await expect(toast).toHaveAttribute('data-type', 'success');
      expect(tosUpdateRequest).toBeTruthy();
      expect(page.getByTestId('publish-terms')).not.toBeVisible();
      await expect(page).toHaveURL(RegExp('/admin/configuration$'));
    });
    test('Confirm button with api failure gives error and stays on page', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');
      await page.getByTestId('publish-terms-btn').click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // When
      await page.getByText('Confirm', { exact: true }).click();
      await page.waitForTimeout(MODAL_DISMISS_TIMEOUT);

      // Then
      const toast = page.getByTestId('toast-root');
      await expect(toast).toBeVisible();
      await expect(toast).toHaveAttribute('data-type', 'error');
      expect(tosUpdateRequest).toBeTruthy();
      expect(page.getByTestId('publish-terms')).not.toBeVisible();
      await expect(page).toHaveURL(RegExp('/admin/configuration/terms/edit$'));
    });
  });

  test.describe('Non-SuperAdmin Users', () => {
    test.use({ storageState: 'tests/.auth/adminUser.json' });

    test('Non-super-admin user has error and publish is disabled', async ({ page }) => {
      // When
      await page.goto('/admin/configuration/terms/edit');

      // Then
      expect(page.getByTestId('admin-warning')).toBeVisible();
      expect(page.getByTestId('publish-terms-btn')).toBeDisabled();
    });
  });
});

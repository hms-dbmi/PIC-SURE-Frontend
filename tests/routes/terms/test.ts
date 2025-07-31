import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail, mockHTMLBodySuccess } from '../../custom-context';
import {
  searchResults as mockSearchResults,
  facetsResponse,
  privileges as mockPrivileges,
  roles as mockRoles,
  applications as mockApps,
  connections as mockConnections,
  picsureUser,
} from '../../mock-data';

import type { Branding } from '../../../src/lib/configuration';
import * as config from '../../../src/lib/assets/configuration.json' assert { type: 'json' };

//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));

const Psama: { [key: string]: string } = {
  TOS: '*/**/psama/tos',
  User: '*/**/psama/user',
};
Psama.Latest = Psama.TOS + '/latest';
Psama.Accept = Psama.TOS + '/accept';
Psama.Update = Psama.TOS + '/update';
Psama.Me = Psama.User + '/me';
Psama.Template = Psama.User + '/me/queryTemplate*';
Psama.Logout = Psama.User + '/logout';

const mockTerms = '<h1>Terms of Service</h1><p>Please accept the terms to use this site.</p>';

test.beforeEach(({ page }) => {
  mockApiSuccess(page, 'https://www.googletagmanager.com/**/*', {});
  mockApiSuccess(page, '*/**/picsure/query/sync', 99);
  mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/concepts*', mockSearchResults);
  mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/facets', facetsResponse);
});

test.describe('Not logged in', () => {
  test('Terms do not open when user is not logged in', async ({ page }) => {
    // When
    await page.goto('/');

    // Then
    await expect(page.locator('#terms-of-service')).not.toBeVisible();
  });
  test('Terms link displays close button', async ({ page }) => {
    // Given
    mockHTMLBodySuccess(page, Psama.Latest, mockTerms);
    await page.goto('/');

    // When
    await page.getByTestId('terms-of-service-btn').click();

    // Then
    await expect(page.locator('#terms-of-service')).toBeVisible();
    await expect(page.getByTestId('modal-close-button')).toBeVisible();
  });
  test('Terms link opens dismissable modal', async ({ page }) => {
    // Given
    mockHTMLBodySuccess(page, Psama.Latest, mockTerms);
    await page.goto('/');
    await page.getByTestId('terms-of-service-btn').click();

    // When
    await page.keyboard.press('Escape');

    // Then
    await expect(page.locator('#terms-of-service')).not.toBeVisible();
  });
});

test.describe('Logged in', () => {
  let tosLatestRequest = false;
  let tosAcceptRequest = false;
  let tosUpdateRequest = false;
  let meRequest = false;
  let logoutRequest = false;

  test.beforeEach(({ page }) => {
    mockHTMLBodySuccess(page, Psama.Latest, mockTerms);
    page.on('request', (request) => {
      if (request.url().includes('/psama/tos/latest')) {
        tosLatestRequest = true;
      } else if (request.url().includes('/psama/tos/accept')) {
        tosAcceptRequest = true;
      } else if (request.url().includes('/psama/tos') && request.method() === 'POST') {
        tosUpdateRequest = true;
      } else if (request.url().includes('/psama/user/me')) {
        meRequest = true;
      } else if (request.url().includes('/psama/user/logout')) {
        logoutRequest = true;
      }
    });
  });

  test.afterEach(() => {
    tosLatestRequest = false;
    tosAcceptRequest = false;
    tosUpdateRequest = false;
    meRequest = false;
    logoutRequest = false;
  });

  test.describe('Terms prompt', () => {
    test.use({ storageState: 'tests/.auth/noTOS.json' });

    test('The TOS modal opens and requests terms html data', async ({ page }) => {
      // When
      await page.goto('/');

      // Then
      expect(tosLatestRequest).toBeTruthy();
      await expect(page.locator('#terms-of-service')).toBeVisible();
    });
    test('Modal does not allow user to dismiss it', async ({ page }) => {
      // Given
      await page.goto('/');

      // When
      await page.keyboard.press('Escape');

      // Then
      await expect(page.locator('#terms-of-service')).toBeVisible();
      await expect(page.getByTestId('modal-close-button')).not.toBeVisible();
    });
    test('Clicking the accept sends request', async ({ page }) => {
      // Given
      mockApiSuccess(page, Psama.Me, picsureUser);
      mockApiSuccess(page, Psama.Template, picsureUser.queryTemplate);
      mockApiSuccess(page, Psama.Accept, '');
      await page.goto('/');

      // When
      await page.getByTestId('terms-accept-btn').click();

      // Then
      expect(tosAcceptRequest).toBeTruthy();
      expect(meRequest).toBeTruthy();
      await expect(page.locator('#terms-of-service')).not.toBeVisible({ timeout: 10000 });
    });
    test('Clicking the reject redirects the user', async ({ page }) => {
      // Given
      mockApiSuccess(page, Psama.Logout, {});
      mockHTMLBodySuccess(
        page,
        branding.termsOfService.rejectionUrl,
        '<h1>Some Rejection Information Page</h1>',
      );
      await page.goto('/');

      // When
      await page.getByTestId('terms-reject-btn').click();

      // Then
      expect(logoutRequest).toBeTruthy();
      const rejectionUrl = RegExp('^' + branding.termsOfService.rejectionUrl);
      await expect(page).toHaveURL(rejectionUrl);
    });
    test('TOS modal has close button after acceptance', async ({ page }) => {
      // Given
      mockApiSuccess(page, Psama.Me, picsureUser);
      mockApiSuccess(page, Psama.Template, picsureUser.queryTemplate);
      mockApiSuccess(page, Psama.Accept, '');
      await page.goto('/');
      await page.getByTestId('terms-accept-btn').click();

      // When
      await page.getByTestId('terms-of-service-btn').click();

      // Then
      await expect(page.locator('#terms-of-service')).toBeVisible();
      await expect(page.getByTestId('modal-close-button')).toBeVisible();
    });
    test('TOS modal is dismissable after acceptance', async ({ page }) => {
      // Given
      mockApiSuccess(page, Psama.Me, picsureUser);
      mockApiSuccess(page, Psama.Template, picsureUser.queryTemplate);
      mockApiSuccess(page, Psama.Accept, '');
      await page.goto('/');
      await page.getByTestId('terms-accept-btn').click();
      await page.getByTestId('terms-of-service-btn').click();

      // When
      await page.keyboard.press('Escape');

      // Then
      await expect(page.locator('#terms-of-service')).not.toBeVisible();
    });
    test('Displays an error box when api fails', async ({ page }) => {
      // Given
      mockApiFail(page, Psama.Latest, 'failed');

      // When
      await page.goto('/');

      // Then
      await expect(page.getByTestId('terms-api-error')).toBeVisible();
      await expect(page.getByTestId('terms-close-btn')).toBeVisible();
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
      await expect(page.getByTestId('publish-terms-btn')).toBeDisabled();
    });
    test('Commit button is enabeld on content change', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');

      // When
      await page.locator('#editor div.ql-editor').fill('Some new text');

      // Then
      await expect(page.getByTestId('publish-terms-btn')).toBeEnabled();
    });
    test('Confirmation modal appears on commit', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');

      // When
      await page.getByTestId('publish-terms-btn').click();

      // Then
      await expect(page.getByTestId('publish-terms')).toBeVisible();
    });
    test('Cancel button does not submit update', async ({ page }) => {
      // Given
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');
      await page.getByTestId('publish-terms-btn').click();

      // When
      await page.getByText('Cancel', { exact: true }).click();

      // Then
      expect(tosUpdateRequest).toBeFalsy();
      await expect(page.getByTestId('publish-terms')).not.toBeVisible();
    });
    test('Confirm button submits updated terms, redirects, and success', async ({ page }) => {
      // Given
      mockHTMLBodySuccess(page, Psama.Update, '');
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');
      await page.getByTestId('publish-terms-btn').click();

      // When
      await page.getByText('Confirm', { exact: true }).click();

      // Then
      const toast = page.getByTestId('toast-root');
      await expect(toast).toBeVisible();
      await expect(toast).toHaveAttribute('data-type', 'success');
      expect(tosUpdateRequest).toBeTruthy();
      await expect(page.getByTestId('publish-terms')).not.toBeVisible();
      await expect(page).toHaveURL(RegExp('/admin/configuration$'));
    });
    test('Confirm button with api failure gives error and stays on page', async ({ page }) => {
      // Given
      mockApiFail(page, Psama.Update, 'failed');
      await page.goto('/admin/configuration/terms/edit');
      await page.locator('#editor div.ql-editor').fill('Some new text');
      await page.getByTestId('publish-terms-btn').click();

      // When
      await page.getByText('Confirm', { exact: true }).click();

      // Then
      const toast = page.getByTestId('toast-root');
      await expect(toast).toBeVisible();
      await expect(toast).toHaveAttribute('data-type', 'error');
      expect(tosUpdateRequest).toBeTruthy();
      await expect(page.getByTestId('publish-terms')).not.toBeVisible();
      await expect(page).toHaveURL(RegExp('/admin/configuration/terms/edit$'));
    });
  });

  test.describe('Non-SuperAdmin Users', () => {
    test.use({ storageState: 'tests/.auth/adminUser.json' });

    test('Non-super-admin user has error and publish is disabled', async ({ page }) => {
      // When
      await page.goto('/admin/configuration/terms/edit');

      // Then
      await expect(page.getByTestId('admin-warning')).toBeVisible();
      await expect(page.getByTestId('publish-terms-btn')).toBeDisabled();
    });
  });
});

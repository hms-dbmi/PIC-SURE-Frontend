import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../custom-context';
import {
  searchResults as mockSearchResults,
  searchResultPath,
  datasets as mockDatasets,
  facetsResponse,
  searchResults,
} from '../mock-data';
import type { Branding } from '../../../src/lib/configuration';
import * as config from '../../../src/lib/assets/configuration.json' assert { type: 'json' };
//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));
const loggedInActions = branding?.landing?.actions?.filter((action) => action.showIfLoggedIn);
const loggedOutActions = branding?.landing?.actions?.filter(
  (action) => !action.showIfLoggedIn || action.isOpen,
);

interface MockLandingStat {
  key: string;
  route: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any;
  value: string;
}

test.describe('Landing page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.describe('Search', () => {
    test('Has expected search to go to explorer', async ({ page }) => {
      // Given
      await mockApiSuccess(page, searchResultPath, mockSearchResults);
      await page.goto('/');
      // When
      await page.fill('input', 'test');
      await page.keyboard.press('Enter');
      // Then
      await expect(page).toHaveURL('/explorer?search=test');
    });
    test('Has expected search to go to explorer with spaces', async ({ page }) => {
      // Given
      await mockApiSuccess(page, searchResultPath, mockSearchResults);
      await page.goto('/');
      // When
      await page.fill('input', 'test with spaces');
      await page.keyboard.press('Enter');
      // Then
      await expect(page).toHaveURL('/explorer?search=test%20with%20spaces');
    });
  });
  test.describe('Stats', () => {
    const stats: MockLandingStat[] = [
      { key: 'query:blank', route: '*/**/picsure/query/sync', api: '88', value: '88' },
      {
        key: 'query:genomic',
        route: '*/**/picsure/query/sync',
        api: { 'some-genome': 4 },
        value: '4',
      },
      {
        key: 'query:biosample',
        route: '*/**/picsure/query/sync',
        api: { 'some-sample': 12 },
        value: '12',
      },
      { key: 'query:consent', route: '*/**/picsure/query/sync', api: '50', value: '50' },
      {
        key: 'dict:concepts',
        route: '*/**/picsure/proxy/dictionary-api/concepts?page_number=1&page_size=1',
        api: searchResults,
        value: searchResults.totalElements.toLocaleString(),
      },
      {
        key: 'dict:facets:dataset_id',
        route: '*/**/picsure/proxy/dictionary-api/facets',
        api: facetsResponse,
        value: facetsResponse[1].facets.length.toLocaleString(),
      },
    ];
    const notFound: MockLandingStat = {
      key: 'not-found',
      route: '*/**',
      api: undefined,
      value: '-',
    };

    branding?.landing?.stats
      ?.filter((stat) => stat.key !== 'hardcoded')
      .forEach((stat) => {
        const mockStat: MockLandingStat = stats.find((s) => s.key === stat.key) || notFound;
        const testID = `value-auth-${stat.key}-${stat.label}`;

        test(`Has expected stat of ${stat.label}`, async ({ page }) => {
          // Given
          await mockApiSuccess(page, mockStat.route, mockStat.api);
          await page.goto('/');

          // Then
          await expect(
            page.getByTestId('data-summary-auth').getByText(stat.label, { exact: true }),
          ).toBeVisible();
        });
        test(`Has expected stat value for ${stat.label}`, async ({ page }) => {
          // Given
          await mockApiSuccess(page, mockStat.route, mockStat.api);
          await page.goto('/');

          // Then
          await expect(page.getByTestId(testID)).toHaveText(mockStat.value);
        });
        test(`Should display error message if api returns error for ${stat.label}`, async ({
          page,
        }) => {
          // Given
          await mockApiFail(page, mockStat.route, 'failed');
          await page.goto('/');

          // Then
          await expect(page.getByTestId(testID).locator('i.fa-circle-exclamation')).toBeVisible();
        });
      });

    test('Shows only auth stats when sets match; both when different', async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/query/sync', '88');
      await mockApiSuccess(
        page,
        '*/**/picsure/proxy/dictionary-api/concepts?page_number=1&page_size=1',
        searchResults,
      );
      await mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/facets', facetsResponse);
      await page.goto('/');

      // Then
      const authContainer = page.getByTestId('data-summary-auth');
      const openContainer = page.getByTestId('data-summary-open');

      await expect(authContainer).toBeVisible();

      // If branding produces identical auth/open sets, open is hidden. If branding differs, both show.
      if (await openContainer.count()) {
        await expect(openContainer).toBeVisible();
      } else {
        await expect(openContainer).toHaveCount(0);
      }
    });
  });
  test.describe('Actions', () => {
    loggedInActions.forEach(({ description, icon, url, title }) => {
      test(`Logged In user Has expected action of description: ${description}`, async ({
        page,
      }) => {
        // Given
        await page.goto('/');
        // Then
        await expect(page.getByText(description, { exact: true })).toBeVisible();
      });
      test(`Logged In user Has expected icon of: ${icon}`, async ({ page }) => {
        // Given
        await page.goto('/');
        // Then
        const iconElement = page.locator(`.${icon.replaceAll(' ', '.')}`);
        const pattern = new RegExp(`.*${icon}.*`);
        await expect(iconElement).toBeVisible();
        await expect(iconElement).toHaveClass(pattern);
      });
      test(`Action button "${description}"'s click leads to ${url}`, async ({ page }) => {
        // Given
        await mockApiSuccess(page, '*/**/picsure/dataset/named', mockDatasets);
        await page.goto('/');

        // When
        const action = page.getByTestId(`landing-action-${title}-btn`);
        await action.isVisible();

        // Then
        if ((await action.getAttribute('target')) !== '_blank') {
          await action.click();
          await expect(page).toHaveURL(`${url}`);
        } else {
          //check if new tab opened
          const newTabPromise = page.waitForEvent('popup');
          await action.click();
          const newPage = await newTabPromise;
          await newPage.waitForLoadState();
          await expect(newPage).not.toBeNull();
          await expect(newPage).toHaveURL(`${url}`);
        }
      });
    });
  });
});

test.describe('Logged Out Landing', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.describe('Stats (Logged Out)', () => {
    const stats: MockLandingStat[] = [
      { key: 'query:blank', route: '*/**/picsure/query/sync', api: '88', value: '88' },
      {
        key: 'query:genomic',
        route: '*/**/picsure/query/sync',
        api: { 'some-genome': 4 },
        value: '4',
      },
      {
        key: 'query:biosample',
        route: '*/**/picsure/query/sync',
        api: { 'some-sample': 12 },
        value: '12',
      },
      { key: 'query:consent', route: '*/**/picsure/query/sync', api: '50', value: '50' },
      {
        key: 'dict:concepts',
        route: '*/**/picsure/proxy/dictionary-api/concepts?page_number=1&page_size=1',
        api: searchResults,
        value: searchResults.totalElements.toLocaleString(),
      },
      {
        key: 'dict:facets:dataset_id',
        route: '*/**/picsure/proxy/dictionary-api/facets',
        api: facetsResponse,
        value: facetsResponse[1].facets.length.toLocaleString(),
      },
    ];
    const notFound: MockLandingStat = {
      key: 'not-found',
      route: '*/**',
      api: undefined,
      value: '-',
    };

    branding?.landing?.stats
      ?.filter((stat) => stat.key !== 'hardcoded')
      .forEach((stat) => {
        const mockStat: MockLandingStat = stats.find((s) => s.key === stat.key) || notFound;
        const testID = `value-open-${stat.key}-${stat.label}`;

        test(`Has expected stat of ${stat.label}`, async ({ page }) => {
          // Given
          await mockApiSuccess(page, mockStat.route, mockStat.api);
          await page.goto('/');

          // Then
          await expect(
            page.getByTestId('data-summary-open').getByText(stat.label, { exact: true }),
          ).toBeVisible();
        });
        test(`Has expected stat value for ${stat.label}`, async ({ page }) => {
          // Given
          await mockApiSuccess(page, mockStat.route, mockStat.api);
          await page.goto('/');

          // Then
          await expect(page.getByTestId(testID)).toHaveText(mockStat.value);
        });
        test(`Should display error message if api returns error for ${stat.label}`, async ({
          page,
        }) => {
          // Given
          await mockApiFail(page, mockStat.route, 'failed');
          await page.goto('/');

          // Then
          await expect(page.getByTestId(testID).locator('i.fa-circle-exclamation')).toBeVisible();
        });
      });
  });

  loggedOutActions.forEach(({ description, icon, url, title }) => {
    test.use({ storageState: 'tests/.auth/unauthenticated.json' });
    test(`Has expected action of description: ${description}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      await expect(page.getByText(description, { exact: true })).toBeVisible();
    });
    test(`Has expected icon of: ${icon}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      const iconElement = page.locator(`.${icon.replaceAll(' ', '.')}`);
      const pattern = new RegExp(`.*${icon}.*`);
      await expect(iconElement).toBeVisible();
      await expect(iconElement).toHaveClass(pattern);
    });
    test(`Button "${description}"'s click leads to ${url}`, async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/dataset/named', mockDatasets);
      await page.goto('/');

      // When
      const action = page.getByTestId(`landing-action-${title}-btn`);
      await action.isVisible();

      // Then
      if ((await action.getAttribute('target')) !== '_blank') {
        await action.click();
        const redirectTo = encodeURIComponent(new URL(url, 'http://localhost').pathname);
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await expect(page).toHaveURL(
          new RegExp(`(${escapedUrl}|/login\\?redirectTo=${redirectTo})$`),
        );
      } else {
        //check if new tab opened
        const newTabPromise = page.waitForEvent('popup');
        await action.click();
        const newPage = await newTabPromise;
        await newPage.waitForLoadState();
        expect(newPage).not.toBeNull();
        await expect(newPage).toHaveURL(`${url}`);
      }
    });
  });
});

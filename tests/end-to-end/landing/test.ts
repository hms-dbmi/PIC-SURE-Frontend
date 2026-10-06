import { readFileSync } from 'node:fs';
import { expect, type BrowserContext } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail, mockApiConfig } from '../custom-context';
import {
  searchResults as mockSearchResults,
  searchResultPath,
  datasets as mockDatasets,
  facetsResponse,
  searchResults,
  mockConsents,
  picsureUser,
} from '../mock-data';
import { userIsLoggedIn } from '../utils';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

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
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page);
    // The app may refresh the signed-in user; answer with nothing new so it keeps the stored one
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', {});
  });

  test.describe('Search', () => {
    test('Has expected search to go to explorer', async ({ page }) => {
      // Given
      await mockApiSuccess(page, searchResultPath, mockSearchResults);
      await page.goto('/');
      await userIsLoggedIn(page);
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
      await userIsLoggedIn(page);
      // When
      await expect(page.locator('input')).toBeVisible();
      await page.fill('input', 'test with spaces');
      await page.keyboard.press('Enter');
      // Then
      await page.waitForURL('/explorer?search=test%20with%20spaces');
      await expect(page).toHaveURL('/explorer?search=test%20with%20spaces');
    });
  });
  test.describe('Stats', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiConfig(page, {
        features: [{ name: 'OPEN', value: 'true' }],
      });
    });

    const stats: MockLandingStat[] = [
      { key: 'query:blank', route: '*/**/picsure/hpds/auth/query/sync', api: '88', value: '88' },
      {
        key: 'query:genomic',
        route: '*/**/picsure/hpds/auth/query/sync',
        api: { 'some-genome': 4 },
        value: '4',
      },
      {
        key: 'query:biosample',
        route: '*/**/picsure/hpds/auth/query/sync',
        api: { 'some-sample': 12 },
        value: '12',
      },
      {
        key: 'query:consent',
        route: '*/**/picsure/hpds/auth/query/sync',
        api: '50',
        value: '50',
      },
      {
        key: 'dict:concepts',
        route: '*/**/picsure/dictionary/concepts?page_number=1&page_size=1',
        api: searchResults,
        value: searchResults.totalElements.toLocaleString(),
      },
      {
        key: 'dict:facets:dataset_id',
        route: '*/**/picsure/dictionary/facets',
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

        test(`Has expected stat label and value for ${stat.label}`, async ({ page }) => {
          // Given
          await mockApiSuccess(page, mockStat.route, mockStat.api);
          await page.goto('/');
          await userIsLoggedIn(page);

          // Then
          await expect(
            page.getByTestId('data-summary-auth').getByText(stat.label, { exact: true }),
          ).toBeVisible();
          await expect(page.getByTestId(testID)).toHaveText(mockStat.value);
        });
        test(`Should display error message if api returns error for ${stat.label}`, async ({
          page,
        }) => {
          // Given
          await mockApiFail(page, mockStat.route, 'failed');
          await page.goto('/');
          await userIsLoggedIn(page);

          // Then
          await expect(page.getByTestId(testID).locator('i.fa-circle-exclamation')).toBeVisible();
        });
      });

    test.describe('with only the login token restored', () => {
      // The generalUser state minus its stored user, so the fixture has no user to put in
      // sessionStorage and the app starts from the token alone.
      const tokenOnlyState = JSON.parse(
        readFileSync('tests/end-to-end/.auth/generalUser.json', 'utf-8'),
      ) as Awaited<ReturnType<BrowserContext['storageState']>>;
      for (const origin of tokenOnlyState.origins) {
        origin.localStorage = origin.localStorage.filter(({ name }) => name !== 'user');
      }
      test.use({ storageState: tokenOnlyState });

      test('Loads authenticated stats', async ({ page }) => {
        await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
        await mockApiSuccess(page, '*/**/psama/user/me', picsureUser);
        await mockApiSuccess(page, '*/**/psama/user/me/consents', { consents: mockConsents });
        await mockApiSuccess(page, '*/**/picsure/hpds/auth/query/sync', '88');
        await mockApiSuccess(
          page,
          '*/**/picsure/dictionary/concepts?page_number=1&page_size=1',
          searchResults,
        );
        await mockApiSuccess(page, '*/**/picsure/dictionary/facets', facetsResponse);
        await page.goto('/');

        await expect(page.getByTestId('value-auth-dict:concepts-Variables')).toHaveText(
          searchResults.totalElements.toLocaleString(),
        );
        const datasets = facetsResponse.find((category) => category.name === 'dataset_id')!;
        await expect(page.getByTestId('value-auth-dict:facets:dataset_id-Data Sources')).toHaveText(
          datasets.facets.filter((facet) => facet.count > 0).length.toLocaleString(),
        );
        await expect(page.getByTestId('toast-root')).not.toBeVisible();
      });
    });
  });
  test.describe('Actions', () => {
    loggedInActions.forEach(({ description, icon, url, title }) => {
      test(`Logged In user Has expected action: ${description}`, async ({ page }) => {
        // Given
        await page.goto('/');
        await userIsLoggedIn(page);
        // Then
        await expect(page.getByText(description, { exact: true })).toBeVisible();
        await expect(page.locator(`.${icon.replaceAll(' ', '.')}`)).toBeVisible();
      });
      test(`Action button "${description}"'s click leads to ${url}`, async ({ page }) => {
        // Given
        await mockApiSuccess(page, '*/**/picsure/operations/dataset/named', mockDatasets);
        await page.goto('/');
        await userIsLoggedIn(page);

        // When
        const action = page.getByTestId(`landing-action-${title}-btn`);
        await expect(action).toBeVisible();

        // Then
        if ((await action.getAttribute('target')) !== '_blank') {
          await action.click();
          await expect(page).toHaveURL(`${url}`, { timeout: 10000 });
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
  test.beforeEach(
    async ({ page }) =>
      // OPEN is required for unauthenticated users to reach any page at all; the
      // root layout redirects to /login when it's off and there's no token.
      // OPEN_EXPLORER defaults to true, and OPEN_EXPLORER + login.open together make
      // useOpenAccess() route stat requests to the auth sync endpoint instead of the
      // plain open one these tests mock, so it must be explicitly disabled here.
      await mockApiConfig(page, {
        features: [
          { name: 'OPEN', value: 'true' },
          { name: 'OPEN_EXPLORER', value: 'false' },
        ],
      }),
  );

  test.describe('Stats (Logged Out)', () => {
    const stats: MockLandingStat[] = [
      { key: 'query:blank', route: '*/**/picsure/hpds/open/query/sync', api: '88', value: '88' },
      {
        key: 'query:genomic',
        route: '*/**/picsure/hpds/open/query/sync',
        api: { 'some-genome': 4 },
        value: '4',
      },
      {
        key: 'query:biosample',
        route: '*/**/picsure/hpds/open/query/sync',
        api: { 'some-sample': 12 },
        value: '12',
      },
      {
        key: 'query:consent',
        route: '*/**/picsure/hpds/open/query/sync',
        api: '50',
        value: '50',
      },
      {
        key: 'dict:concepts',
        route: '*/**/picsure/dictionary/concepts?page_number=1&page_size=1',
        api: searchResults,
        value: searchResults.totalElements.toLocaleString(),
      },
      {
        key: 'dict:facets:dataset_id',
        route: '*/**/picsure/dictionary/facets',
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

        test(`Has expected stat label and value for ${stat.label}`, async ({ page }) => {
          // Given
          await mockApiSuccess(page, mockStat.route, mockStat.api);
          await page.goto('/');

          // Then
          await expect(
            page.getByTestId('data-summary-open').getByText(stat.label, { exact: true }),
          ).toBeVisible();
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
    test(`Has expected action: ${description}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      await expect(page.getByText(description, { exact: true })).toBeVisible();
      await expect(page.locator(`.${icon.replaceAll(' ', '.')}`)).toBeVisible();
    });
    test(`Button "${description}"'s click leads to ${url}`, async ({ page }) => {
      // Given
      await mockApiSuccess(page, '*/**/picsure/operations/dataset/named', mockDatasets);
      await page.goto('/');

      // When
      const action = page.getByTestId(`landing-action-${title}-btn`);
      await expect(action).toBeVisible();

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

import { expect, type Route, type Page } from '@playwright/test';
import { test, mockApiSuccess, unauthedTest } from '../../custom-context';
import {
  searchResults as mockSearchResults,
  searchResultPath,
  datasets as mockDatasets,
  facetsResponse,
  searchResults,
} from '../../mock-data';
import type { Branding } from '../../../src/lib/configuration';
import * as config from '../../../src/lib/assets/configuration.json' assert { type: 'json' };
//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));
const loggedInActions = branding?.landing?.actions?.filter((action) => action.showIfLoggedIn);
const loggedOutActions = branding?.landing?.actions?.filter(
  (action) => !action.showIfLoggedIn || action.isOpen,
);

const HPDS = process.env.VITE_RESOURCE_HPDS;

const mockStatsRoutesFail: { [key: string]: (context: Page) => Promise<void> } = {
  Participants: (context: Page) =>
    context.route('*/**/picsure/query/sync', (route: Route) => route.abort('failed')),
  Variables: (context: Page) =>
    context.route(`*/**/picsure/search/${HPDS}`, (route: Route) => route.abort('failed')),
  'Data Sources': (context: Page) =>
    context.route('*/**/picsure/proxy/dictionary-api/facets/', (route: Route) =>
      route.abort('failed'),
    ),
};

const mockStatsRoutesSuccess = new Map<string, string>([
  ['Participants', '1000'],
  ['Variables', searchResults.totalElements.toLocaleString()],
  ['Data Sources', facetsResponse[1].facets.length.toLocaleString()],
]);

test.describe('Landing page', () => {
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
    branding?.landing?.stats?.forEach((stat) => {
      test(`Has expected stat of ${stat}`, async ({ page }) => {
        // Given
        mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/facets/', facetsResponse);
        mockApiSuccess(
          page,
          '*/**/picsure/proxy/dictionary-api/concepts?page_number=1&page_size=1',
          searchResults,
        );
        mockApiSuccess(page, '*/**/picsure/query/sync', '1000');
        await page.goto('/');

        // Then
        await expect(page.getByText(stat, { exact: true })).toBeVisible();
      });
      test(`Has expected stat value for ${stat}`, async ({ page }) => {
        // Given
        mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/facets/', facetsResponse);
        mockApiSuccess(
          page,
          '*/**/picsure/proxy/dictionary-api/concepts?page_number=1&page_size=1',
          searchResults,
        );
        mockApiSuccess(page, '*/**/picsure/query/sync', '1000');
        await page.goto('/');

        // Then
        await expect(page.getByTestId(`value-${stat}`)).toHaveText(
          mockStatsRoutesSuccess.get(stat) || '-',
        );
      });
      test(`Should display error message if api returns error for ${stat}`, async ({ page }) => {
        // Given
        await mockStatsRoutesFail[stat](page);
        await page.goto('/');

        // Then
        await expect(
          page.getByTestId(`value-${stat}`).locator('i.fa-circle-exclamation'),
        ).toBeVisible();
        await expect(page.locator('#landing-errors')).toBeVisible();
      });
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

unauthedTest.describe('Logged Out Landing', () => {
  loggedOutActions.forEach(({ description, icon, url, title }) => {
    unauthedTest(`Has expected action of description: ${description}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      await expect(page.getByText(description, { exact: true })).toBeVisible();
    });
    unauthedTest(`Has expected icon of: ${icon}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      const iconElement = page.locator(`.${icon.replaceAll(' ', '.')}`);
      const pattern = new RegExp(`.*${icon}.*`);
      await expect(iconElement).toBeVisible();
      await expect(iconElement).toHaveClass(pattern);
    });
    unauthedTest(`Button "${description}"'s click leads to ${url}`, async ({ page }) => {
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

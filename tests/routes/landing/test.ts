import { expect, type Route, type Page } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import { branding } from '../../../src/lib/configuration';
import {
  searchResults as mockSearchResults,
  searchResultPath,
  datasets as mockDatasets,
} from '../../mock-data';

const HPDS = process.env.VITE_RESOURCE_HPDS;

const mockStatsRoutesSuccess: {
  [key: string]: { mock: (context: Page) => Promise<void>; expected: string };
} = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  'Data Sources': { mock: (_context: Page) => Promise.resolve(), expected: '1' },
  Participants: {
    mock: (context: Page) =>
      context.route('*/**/picsure/query/sync', (route: Route) => route.fulfill({ json: '53' })),
    expected: '53',
  },
  Variables: {
    mock: (context: Page) =>
      context.route(`*/**/picsure/search/${HPDS}`, (route: Route) =>
        route.fulfill({ json: { results: { phenotypes: { pheno1: {}, peno2: {} } } } }),
      ),
    expected: '2',
  },
};

const mockStatsRoutesFail: { [key: string]: (context: Page) => Promise<void> } = {
  Participants: (context: Page) =>
    context.route('*/**/picsure/query/sync', (route: Route) => route.abort('failed')),
  Variables: (context: Page) =>
    context.route(`*/**/picsure/search/${HPDS}`, (route: Route) => route.abort('failed')),
};

function mockAllStats(context: Page) {
  return Promise.all(Object.values(mockStatsRoutesSuccess).map((route) => route.mock(context)));
}

test.describe('Landing page', () => {
  test.describe('Search', () => {
    test.beforeEach(({ page }) => mockAllStats(page));
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
    branding.landing.stats.forEach((stat) => {
      test(`Has expected stat of ${stat}`, async ({ page }) => {
        // Given
        await mockAllStats(page);
        await page.goto('/');

        // Then
        await expect(page.getByText(stat, { exact: true })).toBeVisible();
      });
      test(`Has expected stat value for ${stat}`, async ({ page }) => {
        // Given
        await mockAllStats(page);
        await page.goto('/');

        // Then
        await expect(page.getByTestId(`value-${stat}`)).toHaveText(
          mockStatsRoutesSuccess[stat].expected,
        );
      });
      test(`Should display error message if api returns error for ${stat}`, async ({ page }) => {
        if (stat === 'Data Sources') {
          test.skip();
          // Right now, data sources resolves to 1 always
          // TODO: update when data sources is not always 1
        }
        // Given
        await mockAllStats(page);
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
    test.beforeEach(({ page }) => mockAllStats(page));
    branding.landing.actions.forEach(({ description, icon, url }) => {
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
      test(`Card "${description}"'s click leads to ${url}`, async ({ page }) => {
        // Given
        await mockApiSuccess(page, '*/**/picsure/dataset/named', mockDatasets);
        await page.goto('/');

        // When
        const action = page.getByText(description, { exact: true }).locator('..');
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

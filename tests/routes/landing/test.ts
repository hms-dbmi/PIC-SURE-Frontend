import { expect, type Route } from '@playwright/test';
import { test } from '../../custom-context';
import { branding } from '../../../src/lib/configuration';
import {
  searchResults as mockSearchResults,
  searchResultPath,
  datasets as mockDatasets,
} from '../../mock-data';

test.describe('Landing page', () => {
  test('Has expected search to go to explorer', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: mockSearchResults }),
    );
    await page.goto('/');
    // When
    await page.fill('input', 'test');
    await page.keyboard.press('Enter');
    // Then
    await expect(page).toHaveURL('/explorer?search=test');
  });
  test('Has expected search to go to explorer with spaces', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: mockSearchResults }),
    );
    await page.goto('/');
    // When
    await page.fill('input', 'test with spaces');
    await page.keyboard.press('Enter');
    // Then
    await expect(page).toHaveURL('/explorer?search=test%20with%20spaces');
  });
  branding.landing.stats.forEach(({ title, value, valueSrc }) => {
    test(`Has expected stat of title: ${title}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    });
    test(`Has expected stat of value: ${value}`, async ({ page }) => {
      // Given
      await page.goto('/');
      // Then
      //TODO: update to a better test when
      if (!valueSrc) {
        await expect(page.getByText(value, { exact: true })).toBeVisible();
      }
    });
  });
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
      const pattern = new RegExp(`^${icon}.*`);
      await expect(iconElement).toBeVisible();
      await expect(iconElement).toHaveClass(pattern);
    });
    test(`Card "${description}"'s click leads to ${url}`, async ({ page }) => {
      // Given
      await page.route('*/**/picsure/dataset/named', async (route: Route) =>
        route.fulfill({ json: mockDatasets }),
      );
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

import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import { facetResultPath, facetsResponse, detailResponseCat } from '../../../mock-data';

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/concepts*', detailResponseCat);
});

test('Explorer tour button opens instruction modal', async ({ page }) => {
  // Given
  await page.goto('/explorer');

  // When
  await expect(page.getByTestId('explorer-tour-btn')).toBeVisible();
  await page.getByTestId('explorer-tour-btn').click();

  // The
  await expect(page.getByTestId('modal')).toBeVisible();
});
test('Explorer tour starts from modal', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await page.getByTestId('explorer-tour-btn').click();

  // When
  await page.getByTestId('start-explorer-tour-btn').click();

  // Then
  await expect(page.locator('#driver-popover-content')).toBeVisible();
});
test('Escape key closes tour', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await page.getByTestId('explorer-tour-btn').click();
  await page.getByTestId('start-explorer-tour-btn').click();

  // When
  await page.keyboard.press('Escape');

  // Then
  await expect(page.locator('#driver-popover-content')).not.toBeVisible();
});

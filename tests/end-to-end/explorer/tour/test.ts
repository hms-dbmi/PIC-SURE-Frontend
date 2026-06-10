import { expect, type Route } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import {
  facetResultPath,
  facetsResponse,
  detailResponseCat,
  searchResultPath,
  tourSearchResults as mockData,
  conceptsDetailPath,
} from '../../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, '*/**/picsure/proxy/dictionary-api/concepts*', detailResponseCat);
  await mockApiSuccess(page, '*/**/picsure/v3/query/sync', '9999');
});

test('Explorer tour button opens instruction modal', async ({ page }) => {
  // Given
  await page.goto('/explorer');

  // When
  await expect(page.getByTestId('explorer-tour-btn')).toBeVisible();
  await page.getByTestId('explorer-tour-btn').click();

  // The
  await expect(page.locator('#modal-component')).toBeVisible();
});
test('Tour Finishes', async ({ page }) => {
  // Given
  await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
  await page.route(facetResultPath, async (route: Route) =>
    route.fulfill({ json: facetsResponse }),
  );
  await page.route(`${conceptsDetailPath}/${detailResponseCat.dataset}`, async (route: Route) =>
    route.fulfill({ json: detailResponseCat }),
  );
  await page.goto('/explorer');
  await page.getByTestId('explorer-tour-btn').click();
  await page.locator('#modal-component').getByRole('button', { name: 'Start Tour' }).click();

  // When
  const stepCount = await page
    .locator('#driver-popover-content')
    .locator('footer')
    .locator('.driver-popover-progress-text')
    .textContent();
  if (!stepCount) {
    throw new Error('Step count not found');
  }
  const stepCountInt = parseInt(stepCount.split(' ')[2]) || 0;
  for (let i = 0; i < stepCountInt + 1; i++) {
    // +1 to account for the Done button
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
  }

  // Then
  await expect(page.locator('#driver-popover-content')).not.toBeVisible();
});
test('Explorer tour starts from modal', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await page.getByTestId('explorer-tour-btn').click();

  // When
  await page.locator('#modal-component').getByRole('button', { name: 'Start Tour' }).click();

  // Then
  await expect(page.locator('#driver-popover-content')).toBeVisible();
});
test('Escape key closes tour', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await page.getByTestId('explorer-tour-btn').click();
  await page.locator('#modal-component').getByRole('button', { name: 'Start Tour' }).click();

  // When
  await page.keyboard.press('Escape');

  // Then
  await expect(page.locator('#driver-popover-content')).not.toBeVisible();
});

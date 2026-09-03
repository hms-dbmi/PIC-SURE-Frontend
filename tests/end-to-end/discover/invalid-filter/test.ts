import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults as mockData,
} from '../../mock-data';
import { clickNthFilterIcon, userIsLoggedIn } from '../../utils';

// Search result 7 belongs to phs009, the one study absent from the fixture user's consents.
const unconsentedStudyRow = 7;

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Carrying an unauthorized filter from Discover to Explore', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
      ],
    });
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', '9999');
    await mockApiSuccess(page, '*/**/picsure/hpds/auth/v3/query/sync', '9999');

    await page.goto('/discover?search=somedata');
    await userIsLoggedIn(page);
    await clickNthFilterIcon(page, unconsentedStudyRow);
    await page.getByTestId('add-filter').click();
  });

  test('warns rather than letting the filter through to Explore', async ({ page }) => {
    await page.locator('#nav-link-explorer').click();

    await expect(page.getByTestId('sendfilter-warning')).toBeVisible();
    await expect(page).toHaveURL(/\/discover/);
  });

  test('drops the filter and continues to Explore on Remove Invalid Filters', async ({ page }) => {
    await page.locator('#nav-link-explorer').click();
    await page.getByRole('button', { name: 'Remove Invalid Filters' }).click();

    await expect(page).toHaveURL(/\/explorer/);
    await expect(page.getByTestId('sendfilter-warning')).not.toBeVisible();
  });
});

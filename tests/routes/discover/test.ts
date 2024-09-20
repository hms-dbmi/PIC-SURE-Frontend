import { expect, type Route } from '@playwright/test';
import { test } from '../../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults as mockData,
  conceptsDetailPath,
  detailResponseCat,
  crossCountSyncResponseInital,
  crossCountSyncResponsePlus3,
  crossCountSyncResponseLessThan10,
} from '../../mock-data';

test.beforeEach(async ({ page }) => {
  await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
  await page.route(facetResultPath, async (route: Route) =>
    route.fulfill({ json: facetsResponse }),
  );
});

test.describe('Discover', () => {
  test('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/discover');

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Discover can display ±3', async ({ page }) => {
    // Given
    await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route(`*/**/picsure/search/2`, async (route: Route) =>
      route.fulfill({ json: crossCountSyncResponseInital }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ json: crossCountSyncResponsePlus3 }),
    );
    await page.goto('/discover?search=somedata');
    // When
    await clickNthFilterIcon(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();
    const resultArray = crossCountSyncResponsePlus3['\\_studies_consents\\'].split(' ');
    let resultCount = parseInt(resultArray[0]) || 0;
    let suffix = resultArray[1];

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText(`${resultCount?.toLocaleString()} ${suffix}`);
  });
  test('Discover can display < 10', async ({ page }) => {
    // Given
    await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route(`*/**/picsure/search/2`, async (route: Route) =>
      route.fulfill({ json: crossCountSyncResponseInital }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ json: crossCountSyncResponseLessThan10 }),
    );
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('< 10');
  });
});

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const getOption = async (page: any, optionIndex = 0) => {
  const component = page.getByTestId('optional-selection-list');
  const optionContainer = component.locator('#options-container');
  await expect(optionContainer).toBeVisible();
  const options = await optionContainer.getByRole('listitem').all();
  return options[optionIndex];
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const clickNthFilterIcon = async (page: any, rowIndex = 0) => {
  await expect(page.locator('tbody')).toBeVisible();
  const tableBody = page.locator('tbody');
  const firstRow = tableBody.locator('tr').nth(rowIndex);
  const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
  await expect(filterIcon).toBeVisible();
  await filterIcon.click();
};

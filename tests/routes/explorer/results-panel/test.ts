import { expect } from '@playwright/test';
import { test, mockApiFail, mockApiSuccess } from '../../../custom-context';
import {
  conceptsDetailPath,
  conceptTreePath,
  detailResponseCat,
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
  mockDataWithChildren,
} from '../../../mock-data';
import { getOption } from '../../../utils';

const countResultPath = '*/**/picsure/query/sync';

test.use({ storageState: 'tests/.auth/generalUser.json' });

test.describe('Results Panel', () => {
  test('Result panel bar and button shows', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.locator('#side-panel-bar')).toBeVisible();
    await expect(page.locator('#results-panel-toggle')).toBeVisible();
    await page.locator('#results-panel-toggle').click();
  });
  test('Result toggle button opens and closes the results panel', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    //When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();

    //When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).not.toBeVisible();
  });
  test('Result panel shows N/A icon on add filter error with popup', async ({ page }) => {
    // Given
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiFail(page, countResultPath, 'failed');
    await page.locator('#row-0 button[title=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('N/A');
    await expect(page.getByTestId('toast-message')).toBeVisible();
  });
  test('Result panel shows N/A icon and generic error on open with no filters', async ({
    page,
  }) => {
    // Given
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiFail(page, countResultPath, 'failed');
    await page.goto('/explorer?search=somedata');

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('N/A');
    await expect(page.getByTestId('toast-message')).toBeVisible();
  });
  test('Result panel shows the correct number of results', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).not.toHaveText('0');
  });
  test('Result panel shows no filters added when there are no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });
  test('Export button hidden when no filters or exports are added', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when count is 0', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '0');
    await page.goto('/explorer?search=somedata');

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when filter error', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiFail(page, countResultPath, 'failed');
    await page.locator('#row-0 button[title=Filter]').click();
    await page.locator('#options-container label:nth-child(1)').click();
    await page.getByTestId('add-filter').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when count is not 0 and there is no filters', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');

    // When
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Clear All clears exports and filters', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=age');

    const expectedRowIds = mockData.content.map((row) => row.conceptPath);
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();

    const firstRow = tableBody.locator('tr').nth(0);
    const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
    await filterIcon.click();
    const firstFilter = await getOption(page);
    await firstFilter.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();
    await expect(page.getByTestId(`added-filter-${expectedRowIds[0]}`)).toBeVisible();

    const secondRow = tableBody.locator('tr').nth(1);
    const exportButton = secondRow.locator('td').last().locator('button').last();
    await exportButton.click();
    await expect(page.getByTestId(`added-export-${expectedRowIds[1]}`)).toBeVisible();

    // When
    await page.getByTestId('clear-all-results-btn').click();
    await page.locator('#modal-component').getByRole('button', { name: 'Yes' }).click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });
  test.describe('Any record of filter', () => {
    test.beforeEach(async ({ page }) => {
      await mockApiSuccess(page, facetResultPath, facetsResponse);
      await mockApiSuccess(page, searchResultPath, mockData);
      await mockApiSuccess(page, countResultPath, '9999');
      await mockApiSuccess(
        page,
        `${conceptTreePath}${mockData.content[0].dataset}?depth=100`,
        mockDataWithChildren,
      );

      await page.goto('/explorer?search=somedata');

      const tableBody = page.locator('tbody');
      await expect(tableBody).toBeVisible();

      const firstRow = tableBody.locator('tr').nth(0);
      const hierarchyButton = firstRow.locator('td').last().locator('button').nth(2);
      await hierarchyButton.click();
      await expect(page.getByTestId('hierarchy-component')).toBeVisible();
      const secondItem = page.getByTestId('radio:disease');
      await secondItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
    });
    test('Adding an any record of filter adds the filter to the results panel', async ({
      page,
    }) => {
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(page.getByTestId(/^any-record-of-filter-modal-.*$/)).toBeVisible();
    });
    test('Adding an any record of filter adds the correct number of variables to the filter', async ({
      page,
    }) => {
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(page.getByTestId(/^any-record-of-filter-modal-.*$/)).toHaveText(
        `${mockDataWithChildren.children.length} variable(s) in disease category`,
      );
    });
    test('Clicking the Any Record of filter button opens the modal', async ({ page }) => {
      const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*$/);
      await addedFilter.click();
      await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible();
    });
    test('Clicking the Any Record of filter modal has the correct number of variables', async ({
      page,
    }) => {
      const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*$/);
      await addedFilter.click();
      await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible();
      await expect(
        page.getByTestId('any-record-of-filter-modal').locator('header').locator('h1'),
      ).toHaveText(`${mockDataWithChildren.children.length} variable(s) in disease category`);
    });
    test('Clicking the Any Record of filter modal has the correct variables', async ({ page }) => {
      const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*$/);
      await addedFilter.click();
      await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible();
      const variables = page.getByTestId('any-record-of-filter-modal').locator('div').all();
      expect((await variables).length).toBe(mockDataWithChildren.children.length);
      expect((await variables)[0]).toHaveText(mockDataWithChildren.children[0].conceptPath);
    });
    test('Clicking the close button closes the modal', async ({ page }) => {
      const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*$/);
      await addedFilter.click();
      await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible();
      await page.getByTestId('modal-close-button').click();
      await expect(page.getByTestId('any-record-of-filter-modal')).not.toBeVisible();
    });
  });
});

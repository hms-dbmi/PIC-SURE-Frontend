import { expect, type Route } from '@playwright/test';
import { test } from '../../../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  searchResults as mockData,
  searchResultPath,
} from '../../../mock-data';

test.describe('OptionaSelectionList', () => {
  // TODO: Some feartures will be hidden in the future. Cannot use nth.
  // TODO: Test infinite scroll
  test('Renders', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);
    // Then
    await expect(page.getByTestId('optional-selection-list')).toBeVisible();
  });
  test('Search Box shows', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('optional-selection-list');
    const searchBox = component.locator('input[type="search"]');
    // Then
    await expect(searchBox).toBeVisible();
  });
  test('Expected Options are shown and unchecked', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('optional-selection-list');
    const optionContainer = component.locator('#options-container');
    const firstValues = mockData.content[0].values?.slice(0, 2) || [];

    // Then
    await expect(optionContainer).toBeVisible();
    const options = await optionContainer.getByRole('listitem').all();

    for (const option of options) {
      await expect(option).toBeVisible();
      await expect(option).not.toBeChecked();
      await expect(option).toHaveText(firstValues.shift() || '');
    }
  });
  test('Selected options is empty', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('optional-selection-list');
    const selectedOptionContainer = component.locator('#selected-options-container');

    // Then
    const options = await selectedOptionContainer.getByRole('listitem').all();
    expect(options).toHaveLength(0);
  });
  test('Selected option moves to selected option', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);

    // Select first option
    const firstItem = await getOption(page);
    await firstItem.click();
    const component = page.getByTestId('optional-selection-list');

    const selectedOptionContainer = component.locator('#selected-options-container');
    const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
    const firstSelectedOption = selectedOptions[0];
    const checkbox = firstSelectedOption.locator('input');

    // Then
    await expect(firstSelectedOption).toBeVisible();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
  });
  test('Clicking select all button selects all options', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');
    const dataValues = mockData.content[0].values || [];

    // When
    await clickNthFilterIcon(page);

    // Select All
    const component = page.getByTestId('optional-selection-list');
    const selectAllButton = component.locator('#select-all');
    await selectAllButton.click();

    const selectedOptionContainer = component.locator('#selected-options-container');
    const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();

    // Then
    await expect(selectedOptionContainer).toBeVisible();
    for (const option of selectedOptions) {
      await expect(option).toBeVisible();
      await expect(option).toBeChecked();
      await expect(option).toHaveText(dataValues.shift() || '');
    }
    const optionContainer = component.locator('#options-container');
    await expect(optionContainer).toBeEmpty();
  });
  test('Clicking clears removes selected and repopulates the options', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer?search=somedata');
    await clickNthFilterIcon(page);
    const component = page.getByTestId('optional-selection-list');
    const optionContainer = component.locator('#options-container');
    const selectedOptionContainer = component.locator('#selected-options-container');
    const option = '#option-' + getId(mockData.content[0].values?.[0] || 'yes');

    // When
    await page.locator(option).click();
    await expect(optionContainer.locator(option)).not.toBeVisible();
    await expect(selectedOptionContainer.locator(option)).toBeVisible();
    await component.locator('#clear').click();

    // Then
    await expect(selectedOptionContainer).toBeEmpty();
    await expect(optionContainer.locator(option)).toBeVisible();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const getOption = async (page: any, optionIndex = 0) => {
  const component = page.getByTestId('optional-selection-list');
  const optionContainer = component.locator('#options-container');
  await expect(optionContainer).toBeVisible();
  const options = await optionContainer.getByRole('listitem').all();
  return options[optionIndex];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const clickNthFilterIcon = async (page: any, rowIndex = 0) => {
  await expect(page.locator('tbody')).toBeVisible();
  const tableBody = page.locator('tbody');
  const firstRow = tableBody.locator('tr').nth(rowIndex);
  const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
  await expect(filterIcon).toBeVisible();
  await filterIcon.click();
};

function getId(option: string) {
  return option.replaceAll(' ', '-').toLowerCase();
}

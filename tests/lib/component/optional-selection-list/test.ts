import { expect, type Route } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  searchResults as mockData,
  searchResultPath,
  geneValues,
  geneValuesPage2,
} from '../../../mock-data';

const HPDS = process.env.VITE_RESOURCE_HPDS;

test.use({ storageState: '.playwright/.auth/generalUser.json' });

test.describe('OptionaSelectionList', () => {
  // TODO: Some feartures will be hidden in the future. Cannot use nth.
  // TODO: Test infinite scroll
  test('Renders', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/discover?search=somedata');

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
    await page.goto('/discover?search=somedata');

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
    await page.goto('/discover?search=somedata');

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
    await page.goto('/discover?search=somedata');

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
    await page.goto('/discover?search=somedata');

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
    await page.goto('/discover?search=somedata');
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
  test('Clicking select all button selects all options in the data', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat2 }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/discover?search=somedata');
    const dataValues = mockData.content[2].values || [];

    // When
    await clickNthFilterIcon(page, 2);

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
    expect(selectedOptions.length === dataValues.length);
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
    await page.goto('/discover?search=somedata');
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
  test('Loads next values when scrolling', async ({ page }) => {
    // Given
    const mockDataWithManyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: mockDataWithManyOptions }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('optional-selection-list');
    const optionContainer = component.locator('#options-container');

    // Then
    await expect(optionContainer).toBeVisible();

    // Check initial load
    let visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(41);

    // Scroll to bottom
    await optionContainer.evaluate((node) => node.scrollTo(0, node.scrollHeight));

    // Wait for more options to load
    await page.waitForTimeout(1000); // Adjust timeout as needed

    // Check if more options have loaded
    visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeGreaterThan(20); // Assuming initial page size is 20
    expect(visibleOptions.length).toBeLessThan(100); // Ensure not all options are loaded at once

    // Verify last visible option
    const lastVisibleOption = visibleOptions[visibleOptions.length - 1];
    await expect(lastVisibleOption).toBeVisible();
    await expect(lastVisibleOption).toHaveText(/Option \d+/);
  });
  test('Loads next values when scrolling when infinite scroll is enabled', async ({ page }) => {
    // Given
    const mockDataWithManyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: mockDataWithManyOptions }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await mockApiSuccess(
      page,
      `*/**/picsure/search/${HPDS}/values/?genomicConceptPath=Gene_with_variant&query=&page=1&size=20`,
      {
        ...geneValues,
      },
    );
    await page.goto('/explorer');

    // When
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('gene-variant-option').click();
    const component = page.getByTestId('optional-selection-list');
    const optionContainer = component.locator('#options-container');

    // Then
    await expect(optionContainer).toBeVisible();

    // Check initial load
    let visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(21);

    await mockApiSuccess(
      page,
      `*/**/picsure/search/${HPDS}/values/?genomicConceptPath=Gene_with_variant&query=&page=2&size=20`,
      {
        ...geneValuesPage2,
      },
    );

    // Scroll to bottom
    await optionContainer.evaluate((node) => node.scrollTo(0, node.scrollHeight + 30));

    // Wait for more options to load
    await page.waitForTimeout(1000); // Adjust timeout as needed

    // Check if more options have loaded
    visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeGreaterThan(20); // Assuming initial page size is 20
    expect(visibleOptions.length).toBeLessThan(100); // Ensure not all options are loaded at once

    // Verify last visible option
    const lastVisibleOption = visibleOptions[visibleOptions.length - 1];
    await expect(lastVisibleOption).toBeVisible();
  });
  test('Loads next selected values when scrolling', async ({ page }) => {
    // Given
    const mockDataWithManyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: mockDataWithManyOptions }),
    );
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('optional-selection-list');

    // Select all options
    await component.locator('#select-all').click();

    const selectedOptionsContainer = component.locator('#selected-options-container');

    // Then
    await expect(selectedOptionsContainer).toBeVisible();

    // Check initial load of selected options
    let visibleSelectedOptions = await selectedOptionsContainer.getByRole('listitem').all();
    expect(visibleSelectedOptions.length).toBe(20); // Assuming initial page size is 20

    // Scroll to bottom of selected options
    await selectedOptionsContainer.evaluate((node) => node.scrollTo(0, node.scrollHeight));

    // Wait for more options to load
    await page.waitForTimeout(1000); // Adjust timeout as needed

    // Check if more selected options have loaded
    visibleSelectedOptions = await selectedOptionsContainer.getByRole('listitem').all();
    expect(visibleSelectedOptions.length).toBeGreaterThan(20);
    expect(visibleSelectedOptions.length).toBeLessThan(50); // Ensure not all options are loaded at once

    // Verify last visible selected option
    const lastVisibleSelectedOption = visibleSelectedOptions[visibleSelectedOptions.length - 1];
    await expect(lastVisibleSelectedOption).toBeVisible();
    await expect(lastVisibleSelectedOption).toHaveText(/Option \d+/);
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

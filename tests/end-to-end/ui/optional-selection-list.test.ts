import { expect, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  searchResults as mockData,
  searchResultPath,
  geneValues,
  geneValuesPage2,
  facetResultPath,
  facetsResponse,
} from '../../support/mock-data';
import { getOption, clickNthFilterIcon, optionsHaveLoaded, userIsLoggedIn } from '../utils';

const queryResultPath = '*/**/picsure/hpds/auth/query/sync';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('OptionalSelectionList', () => {
  test.beforeEach(async ({ page }) => {
    // DISCOVER is required because every test here navigates to /discover; the
    // (public) layout guard redirects to /explorer when it's off.
    await mockApiConfig(page, { features: [{ name: 'DISCOVER', value: 'true' }] });
    await mockApiSuccess(page, facetResultPath, facetsResponse);
  });
  // TODO: Some feartures will be hidden in the future. Cannot use nth.
  // TODO: Test infinite scroll
  test('Options are shown unchecked with nothing selected', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const firstValues = detailResponseCat.meta.values;

    // Then
    await optionsHaveLoaded(page);
    const component = page.getByTestId('ui-options-selection-list');
    const optionContainer = component.getByTestId('ui-options-selection-list-available');
    const options = await optionContainer.getByRole('listitem').all();

    expect(options.length).toBeGreaterThan(0);
    for (const [i, option] of options.entries()) {
      await expect(option).toBeVisible();
      await expect(option).not.toBeChecked();
      await expect(option).toHaveText(firstValues[i]);
    }
    await expect(
      component.getByTestId('ui-options-selection-list-selected').getByRole('listitem'),
    ).toHaveCount(0);
  });
  test('Selected option moves to selected option', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}/${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);

    // Select first option
    const firstItem = await getOption(page);
    await firstItem.click();
    const component = page.getByTestId('ui-options-selection-list');

    const selectedOptionContainer = component.getByTestId('ui-options-selection-list-selected');
    const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
    const firstSelectedOption = selectedOptions[0];
    const checkbox = firstSelectedOption.locator('input');

    // Then
    await expect(firstSelectedOption).toBeVisible();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
  });
  test('Clicking select all button selects all options in the data', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}/${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat2 }),
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/discover?search=somedata');
    const dataValues = mockData.content[2].values || [];

    // When
    await clickNthFilterIcon(page, 2);

    // Select All
    const component = page.getByTestId('ui-options-selection-list');
    const selectAllButton = component.getByTestId('ui-options-selection-list-select-all');
    await selectAllButton.click();

    const selectedOptionContainer = component.getByTestId('ui-options-selection-list-selected');
    const selectedOptions = selectedOptionContainer.getByRole('listitem');

    // Then: the list renders one page of 20 at a time
    await expect(selectedOptions).toHaveText(dataValues.slice(0, 20));
    for (const option of await selectedOptions.all()) {
      await expect(option).toBeChecked();
    }
    const optionContainer = component.getByTestId('ui-options-selection-list-available');
    await expect(optionContainer).toBeEmpty();
  });
  test('Clicking clears removes selected and repopulates the options', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}/${detailResponseCat.dataset}`, async (route: Route) =>
      route.fulfill({ json: detailResponseCat }),
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/discover?search=somedata');
    await clickNthFilterIcon(page);
    const component = page.getByTestId('ui-options-selection-list');
    const optionContainer = component.getByTestId('ui-options-selection-list-available');
    const selectedOptionContainer = component.getByTestId('ui-options-selection-list-selected');
    const option = mockData.content[0].values?.[0] || 'yes';

    // When
    await optionContainer.getByLabel(option, { exact: true }).click();
    await expect(optionContainer.getByLabel(option, { exact: true })).not.toBeVisible();
    await expect(selectedOptionContainer.getByLabel(option, { exact: true })).toBeVisible();
    await component.getByTestId('ui-options-selection-list-clear').click();

    // Then
    await expect(selectedOptionContainer).toBeEmpty();
    await expect(optionContainer.getByLabel(option, { exact: true })).toBeVisible();
  });
  test('Loads next values when scrolling', async ({ page }) => {
    // Given
    const mockDataWithManyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}/${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: mockDataWithManyOptions }),
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('ui-options-selection-list');
    const optionContainer = component.getByTestId('ui-options-selection-list-available');

    // Then
    await optionsHaveLoaded(page);

    // Check initial load
    let visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(41);

    // Scroll to bottom
    await optionContainer.evaluate((node) => node.scrollTo(0, node.scrollHeight));

    // Then more options load (the page size is 20)
    await expect.poll(() => optionContainer.getByRole('listitem').count()).toBeGreaterThan(20);
    visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(100); // Ensure not all options are loaded at once

    // Verify last visible option
    const lastVisibleOption = visibleOptions[visibleOptions.length - 1];
    await expect(lastVisibleOption).toBeVisible();
    await expect(lastVisibleOption).toHaveText(/Option \d+/);
  });
  test('Loads next values when scrolling when infinite scroll is enabled', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
      ],
    });
    const mockDataWithManyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(`${conceptsDetailPath}/${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: mockDataWithManyOptions }),
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await mockApiSuccess(
      page,
      `*/**/picsure/hpds/auth/search/values?genomicConceptPath=Gene_with_variant&query=&page=1&size=20`,
      {
        ...geneValues,
      },
    );
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('explorer-genomic-filter-open').click();
    await expect(page.getByTestId('genomic-type-gene')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('genomic-type-gene').click();
    const component = page.getByTestId('ui-options-selection-list');
    const optionContainer = component.getByTestId('ui-options-selection-list-available');

    // Then
    await optionsHaveLoaded(page);

    // Check initial load
    let visibleOptions = await optionContainer.getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(21);

    await mockApiSuccess(
      page,
      `*/**/picsure/hpds/auth/search/values?genomicConceptPath=Gene_with_variant&query=&page=2&size=20`,
      {
        ...geneValuesPage2,
      },
    );

    // Scroll to bottom
    await optionContainer.evaluate((node) => node.scrollTo(0, node.scrollHeight + 30));

    // Then more options load (the page size is 20)
    await expect.poll(() => optionContainer.getByRole('listitem').count()).toBeGreaterThan(20);
    visibleOptions = await optionContainer.getByRole('listitem').all();
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
    await page.route(`${conceptsDetailPath}/${detailResponseCat2.dataset}`, async (route: Route) =>
      route.fulfill({ json: mockDataWithManyOptions }),
    );
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const component = page.getByTestId('ui-options-selection-list');
    await optionsHaveLoaded(page);

    // Select all options
    await component.getByTestId('ui-options-selection-list-select-all').click();

    const selectedOptionsContainer = component.getByTestId('ui-options-selection-list-selected');

    // Then
    await optionsHaveLoaded(page, 'selected');

    // Check initial load of selected options
    let visibleSelectedOptions = await selectedOptionsContainer.getByRole('listitem').all();
    expect(visibleSelectedOptions.length).toBe(20); // Assuming initial page size is 20

    // Scroll to bottom of selected options
    await selectedOptionsContainer.evaluate((node) => node.scrollTo(0, node.scrollHeight));

    // Then more selected options load
    await expect
      .poll(() => selectedOptionsContainer.getByRole('listitem').count())
      .toBeGreaterThan(20);
    visibleSelectedOptions = await selectedOptionsContainer.getByRole('listitem').all();
    expect(visibleSelectedOptions.length).toBeLessThan(50); // Ensure not all options are loaded at once

    // Verify last visible selected option
    const lastVisibleSelectedOption = visibleSelectedOptions[visibleSelectedOptions.length - 1];
    await expect(lastVisibleSelectedOption).toBeVisible();
    await expect(lastVisibleSelectedOption).toHaveText(/Option \d+/);
  });
});

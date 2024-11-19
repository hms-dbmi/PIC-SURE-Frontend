import { expect, type Route } from '@playwright/test';
import { test, mockApiFail, getUserTest } from '../../custom-context';
import {
  conceptsDetailPath,
  detailResForAge,
  detailResForAge2,
  detailResponseCat,
  detailResponseCat2,
  detailResponseCatSameDataset,
  facetResultPath,
  facetsResponse,
  searchResults as mockData,
  searchResultPath,
  picsureUser,
  facetResponseWithZeroCount,
} from '../../mock-data';
import { type SearchResult } from '../../../src/lib/models/Search';
import { createCategoricalFilter, createNumericFilter } from '../../../src/lib/models/Filter';

test.beforeEach(async ({ page }) => {
  await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
  await page.route(facetResultPath, async (route: Route) =>
    route.fulfill({ json: facetsResponse }),
  );
});

const userTest = getUserTest(picsureUser);

userTest.describe('Explorer for authenticated users', () => {
  userTest('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/explorer');

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  userTest(
    'Has filters, and searchbar when a search is from the landing page',
    async ({ page }) => {
      // Given
      await page.goto('/');
      await page.getByTestId('search-box').fill('somedata');
      await page.locator('#search-button').click();

      // Then
      await expect(page.locator('#search-bar')).toBeVisible();
      await expect(page.locator('#facet-side-bar')).toBeVisible();
    },
  );
  userTest('Has filters, and searchbar when a search is from the url', async ({ page }) => {
    // Given
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  userTest('Facets with zero count are hidden', async ({ page }) => {
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetResponseWithZeroCount }),
    );
    // Given
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.locator('#facet-side-bar')).toBeVisible();
    expect(page
      .getByTestId('accordion-item')
      .first()
      .getByTestId(`facet-${facetResponseWithZeroCount[0].name}-label`)
    ).not.toBeVisible();
  });
});

test.describe('explorer', () => {
  test('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/explorer');

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Has filters, and searchbar when a search is from the landing page', async ({ page }) => {
    // Given
    await page.goto('/');
    await page.getByTestId('search-box').fill('somedata');
    await page.locator('#search-button').click();

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Has filters, and searchbar when a search is from the url', async ({ page }) => {
    // Given
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Has search result table when search is executed', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer');

    // When
    await page.getByTestId('search-box').fill('somedata');
    await page.locator('#search-button').click();

    // Then
    await expect(page.locator('table')).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await mockApiFail(page, searchResultPath, 'accessdenied');
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test.describe('Search row actions', () => {
    // TODO: Some feartures will be hidden in the future. Cannot use nth.
    test.describe('Info Actions', () => {
      test('Clicking a row opens info panel', async ({ page }) => {
        // Given
        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();

        // Then
        const infoPanel = tableBody.locator('tr.expandable-row').first();
        await expect(infoPanel).toBeVisible();
      });
      test('Clicking the row again closes the info panel', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();

        // Then
        const infoPanel = tableBody.locator('tr.expandable-row').first();
        await expect(infoPanel).toBeVisible();

        // Then
        await firstRow.click();
        await expect(infoPanel).not.toBeVisible();
      });
      test('Clicking the info icon opens and then closes the info panel', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const infoIcon = firstRow.locator('td').last().locator('button').first();
        await expect(infoIcon).toBeVisible();
        await infoIcon.click();

        // Then
        const infoPanel = tableBody.locator('tr.expandable-row').first();
        await expect(infoPanel).toBeVisible();

        // Then
        await infoIcon.click();
        await expect(infoPanel).not.toBeVisible();
      });
      test('Clicking the info icon opens the info panel with the correct information', async ({
        page,
      }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.route(
          '*/**/picsure/proxy/dictionary-api/concepts/detail/' + mockData.content[0].dataset,
          async (route: Route) => route.fulfill({ json: detailResponseCat }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const infoIcon = firstRow.locator('td').last().locator('button').first();
        await expect(infoIcon).toBeVisible();
        await infoIcon.click();

        // Then
        const infoPanel = tableBody.locator('tr.expandable-row').first();
        await expect(infoPanel).toBeVisible();
        const variableInfo = infoPanel.getByTestId('variable-info');
        await expect(variableInfo).toBeVisible();
        // Check Variable Information
        await expect(variableInfo.getByText('Variable Information')).toBeVisible();
        await expect(variableInfo.getByText('Name: ' + detailResponseCat.display)).toBeVisible();
        await expect(variableInfo.getByText('Accession: ' + detailResponseCat.name)).toBeVisible();
        await expect(variableInfo.getByText('Type: ' + detailResponseCat.type)).toBeVisible();
        await expect(
          variableInfo.getByText('Description: ' + detailResponseCat.description),
        ).toBeVisible();

        // Check Dataset Information
        await expect(infoPanel.getByText('Dataset Information')).toBeVisible();
        await expect(infoPanel.getByText('Name: ' + detailResponseCat.table.display)).toBeVisible();
        await expect(
          infoPanel.getByText('Accession: ' + detailResponseCat.table.name),
        ).toBeVisible();
        await expect(
          infoPanel.getByText('Description: ' + detailResponseCat.table.description),
        ).toBeVisible();

        // Check Study Information
        await expect(infoPanel.getByText('Study Information')).toBeVisible();
        await expect(
          infoPanel.getByText('Study Name: ' + detailResponseCat.study.fullName),
        ).toBeVisible();
        await expect(
          infoPanel.getByText('Study Accession: ' + detailResponseCat.study.ref),
        ).toBeVisible();
      });
    });
    test.describe('Filter Actions', () => {
      test('Clicking the filter button opens and then closes the filter panel', async ({
        page,
      }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await clickNthFilterIcon(page);

        // Then
        const tableBody = page.locator('tbody');
        const panel = tableBody.locator('tr.expandable-row').first();
        await expect(panel).toBeVisible();

        // Then
        await clickNthFilterIcon(page);
        await expect(panel).not.toBeVisible();
      });
      test('Clicking the filter button opens the correct filter panel', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await clickNthFilterIcon(page);
        const mockdataType = mockData.content[0].type;

        // Then
        const tableBody = page.locator('tbody');
        const panel = tableBody.locator('tr.expandable-row').first();
        await expect(panel).toBeVisible();
        if (mockdataType === 'Categorical') {
          await expect(page.getByTestId('categoical-filter')).toBeVisible();
        } else {
          await expect(page.getByTestId('numerical-filter')).toBeVisible();
        }
      });
      test('Clicking the filter button opens the correct filter panel (numerical)', async ({
        page,
      }) => {
        // Given
        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await clickNthFilterIcon(page, 2);
        const mockdataType = mockData.content[2].type;

        // Then
        const tableBody = page.locator('tbody');
        const panel = tableBody.locator('tr.expandable-row').first();
        await expect(panel).toBeVisible();
        if (mockdataType === 'Categorical') {
          await expect(page.getByTestId('categoical-filter')).toBeVisible();
        } else {
          await expect(page.getByTestId('numerical-filter')).toBeVisible();
        }
      });
      test('Searching in filter shows only searched options', async ({ page }) => {
        // Given
        const row = mockData.content[0] as SearchResult;
        const searchValue = 'No';

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.route(
          '*/**/picsure/proxy/dictionary-api/concepts/detail/' + row.dataset,
          async (route: Route) => route.fulfill({ body: JSON.stringify(row) }),
        );
        await page.goto('/explorer?search=somedata');
        await clickNthFilterIcon(page, 0);

        // When
        await page
          .getByTestId('optional-selection-list')
          .getByPlaceholder('Search...')
          .fill(searchValue);

        // Then
        const searchString = (value: string) =>
          value.toLowerCase().includes(searchValue.toLowerCase());
        const include = (row.values || []).filter(searchString);
        const exclude = (row.values || []).filter((value) => !searchString(value));
        const options = page.locator('#options-container');
        await Promise.all([
          ...include.map((value) =>
            expect(options.getByLabel(value, { exact: true })).toBeVisible(),
          ),
          ...exclude.map((value) =>
            expect(options.getByLabel(value, { exact: true })).not.toBeVisible(),
          ),
        ]);
      });
      test('Select all disabled when all options are added', async ({ page }) => {
        // Given
        const row = mockData.content[0] as SearchResult;

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.route(
          '*/**/picsure/proxy/dictionary-api/concepts/detail/' + row.dataset,
          async (route: Route) => route.fulfill({ body: JSON.stringify(row) }),
        );
        await page.goto('/explorer?search=somedata');
        await clickNthFilterIcon(page, 0);

        // When
        const searchBtn = page.locator('#select-all');
        await page.locator('#select-all').click();

        // Then
        await expect(page.locator('#options-container')).toBeEmpty();
        await expect(searchBtn).toBeDisabled();
      });
      test('The dictionary details are different for the same dataset', async ({ page }) => {
        // Given
        await page.route(
          `${conceptsDetailPath}${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat }),
        );
        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await clickNthFilterIcon(page);
        const firstItem = await getOption(page);

        // Then
        const firstItemText: string = await firstItem.textContent();
        expect(await firstItemText?.trim()).toBe(detailResponseCat.values[0]);
        // Close the filter panel
        clickNthFilterIcon(page);

        // Then Given
        await page.route(
          `${conceptsDetailPath}${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCatSameDataset }),
        );
        // When
        await clickNthFilterIcon(page, 1);

        const secondItem = await getOption(page);
        // Then
        const secondItemText: string = await secondItem.textContent();
        expect(secondItemText?.trim()).toBe(detailResponseCatSameDataset.values[0]);
      });
      test('The dictionary details are cached', async ({ page }) => {
        // Given
        // Given
        await page.route(
          `${conceptsDetailPath}${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat }),
        );
        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await clickNthFilterIcon(page);
        let firstItem = await getOption(page);

        // Then
        const firstItemText: string = await firstItem.textContent();
        expect(await firstItemText?.trim()).toBe(detailResponseCat.values[0]);
        // Close the filter panel
        clickNthFilterIcon(page);

        // Then Given
        await page.route(
          `${conceptsDetailPath}${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCatSameDataset }),
        );
        // When
        await clickNthFilterIcon(page, 1);

        const secondItem = await getOption(page);
        // Then
        const secondItemText: string = await secondItem.textContent();
        expect(secondItemText?.trim()).toBe(detailResponseCatSameDataset.values[0]);

        // Then Given
        // This should not be hit so I am putting detailResponseCat2 which is wrong
        await clickNthFilterIcon(page, 1);
        await page.route(
          `${conceptsDetailPath}${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat2 }),
        );

        // When
        await clickNthFilterIcon(page, 0);
        firstItem = await getOption(page);
        // Then
        const sameString: string = await firstItem.textContent();
        expect(sameString?.trim()).toBe(detailResponseCat.values[0]);
        expect(sameString?.trim()).toBe(firstItemText?.trim());
      });
    });
    test.describe('Export Actions', () => {
      test('Clicking the export button flips the icon', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const exportButton = firstRow.locator('td').last().locator('button').last();
        await expect(exportButton).toBeVisible();
        const iconExport = exportButton.locator('i');
        await expect(iconExport).toHaveClass(/fa-right-from-bracket/);

        // Then
        await exportButton.click();
        await expect(iconExport).toHaveClass(/fa-square-check/);
        await exportButton.click();
        await expect(iconExport).toHaveClass(/fa-right-from-bracket/);
      });
      test('Clicking the export button opens result panel', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const exportButton = firstRow.locator('td').last().locator('button').last();
        await exportButton.click();

        // Then
        await expect(page.locator('#results-panel')).toBeVisible();
      });
      test('Clicking the export button opens result panel and the variable show in the list', async ({
        page,
      }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const exportButton = firstRow.locator('td').last().locator('button').last();
        await exportButton.click();

        // Then
        await expect(page.getByTestId('export-header')).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].conceptPath}`),
        ).toBeVisible();
      });
      test('Clicking an export remove button removes the export', async ({ page }) => {
        //todo check remove button class
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const exportButton = firstRow.locator('td').last().locator('button').last();
        await exportButton.click();
        const removeButton = page
          .getByTestId(`added-export-${mockData.content[0].conceptPath}`)
          .locator('button');
        removeButton.click();
        // Then
        await expect(page.getByTestId('export-header')).not.toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].display}`),
        ).not.toBeVisible();
      });
      test('Clicking a second export adds a second export', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const exportButton = firstRow.locator('td').last().locator('button').last();
        const firstRow2 = tableBody.locator('tr').nth(1);
        const exportButton2 = firstRow2.locator('td').last().locator('button').last();
        await exportButton.click();
        await exportButton2.click();

        // Then
        await expect(page.getByTestId('export-header')).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].conceptPath}`),
        ).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[1].conceptPath}`),
        ).toBeVisible();
      });
      test('Exports remmain after closing and opening the results panel', async ({ page }) => {
        // Given

        await page.route('*/**/picsure/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const exportButton = firstRow.locator('td').last().locator('button').last();
        const firstRow2 = tableBody.locator('tr').nth(1);
        const exportButton2 = firstRow2.locator('td').last().locator('button').last();
        await exportButton.click();
        await exportButton2.click();
        await page.locator('#results-panel-toggle').click();

        // Then
        await expect(page.locator('#results-panel')).not.toBeVisible();
        await page.locator('#results-panel-toggle').click();

        // Then
        await expect(page.locator('#results-panel')).toBeVisible();
        await expect(page.getByTestId('export-header')).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].conceptPath}`),
        ).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[1].conceptPath}`),
        ).toBeVisible();
      });
    });
    // TODO: Renable Hierarchy action tests when feature is implemented
    // test.describe('Hierarchy Actions', () => {
    //   test('Hierarchy component shows when action button clicked', async ({ page }) => {
    //     // Given

    //     await page.route('*/**/picsure/query/sync', async (route: Route) =>
    //       route.fulfill({ body: '9999' }),
    //     );
    //     await page.goto('/explorer?search=somedata');

    //     // When
    //     await expect(page.locator('tbody')).toBeVisible();
    //     const tableBody = page.locator('tbody');
    //     const firstRow = tableBody.locator('tr').first();
    //     const hierarchyButton = firstRow.locator('td').last().locator('button').nth(2);
    //     await hierarchyButton.click();

    //     // Then
    //     await expect(page.getByTestId('hierarchy-component')).toBeVisible();
    //   });
    // });
  });
  test.describe('Add Filters', () => {
    test('Add button is disabled when nothing is selected', async ({ page }) => {
      // Given

      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      // Then
      await expect(page.getByTestId('add-filter')).toBeVisible();
      await expect(page.getByTestId('add-filter')).toBeDisabled();
    });
    test('Add button is enabled when something is selected', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      // Then
      await expect(page.getByTestId('add-filter')).toBeEnabled();
    });
    test('Clicking the add butoon options the results panel', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();

      // Then
      await expect(page.locator('#results-panel')).toBeVisible();
    });
    test('Clicking the add button adds the filter to the results panel', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult: SearchResult = {
        conceptPath: '\\SOMEDATA\\questionnaire\\disease\\Any family with heart attack?\\',
        name: 'heart_test',
        display: 'Any family with heart attack?',
        dataset: 'test_data_set',
        studyAcronym: 'TDS',
        description: 'Do you have a history of heart attack? Including extended family?',
        values: ['Yes', 'No', "Don't know"],
        children: null,
        meta: null,
        type: 'Categorical',
        allowFiltering: true,
      };
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);

      // Then
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(firstAddedFilter).toBeVisible();
    });
    test('Added Filter has expected buttons', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const buttons = firstAddedFilter.locator('button');
      const editbutton = buttons.first();
      const removeButton = buttons.nth(1);
      const openButton = buttons.last();
      // Then
      await expect(firstAddedFilter).toBeVisible();
      await expect(editbutton).toBeVisible();
      await expect(editbutton).toBeEnabled();
      const iconExport = editbutton.locator('i');
      await expect(iconExport).toHaveClass(/fa-pen-to-square/);

      await expect(removeButton).toBeVisible();
      await expect(removeButton).toBeEnabled();
      const iconRemove = removeButton.locator('i');
      await expect(iconRemove).toHaveClass(/fa-times-circle/);

      await expect(openButton).toBeVisible();
      await expect(openButton).toBeEnabled();
      const iconOpen = openButton.locator('i');
      await expect(iconOpen).toHaveClass(/fa-caret-up/);
    });
    test('Clicking added filter opens more info', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(openButton.locator('i')).toHaveClass(/fa-caret-down/);
    });
    test('Clicking open filter closes the more info section', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(openButton.locator('i')).toHaveClass(/fa-caret-down/);
      await openButton.click();
      await expect(infoSection).not.toBeVisible();
      await expect(openButton.locator('i')).toHaveClass(/fa-caret-up/);
    });
    test('Fitlers with selected values list values and count', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createCategoricalFilter(
        mockData.content[0] as SearchResult,
        mockData.content[0]?.values?.slice(0, 1) || [],
      );
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText('Restricting to 1 value.');
      await expect(infoSection).toContainText(`Values: ${filter.categoryValues.join(', ')}`);
    });
    test('Fitlers with all values selected list count and correct text', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const component = page.getByTestId('optional-selection-list');
      const selectAllButton = component.locator('#select-all');
      await selectAllButton.click();

      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText('Restricting to any value.');
    });
    test('Fitlers with the same name but different id are both added', async ({ page }) => {
      // Given
      await page.route(
        `${conceptsDetailPath}${mockData.content[5].dataset}`,
        async (route: Route) => route.fulfill({ json: detailResForAge }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page, 5);
      const selectAllButton = page.locator('#select-all');
      await selectAllButton.click();

      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();

      await page.route(
        `${conceptsDetailPath}${mockData.content[5].dataset}`,
        async (route: Route) => route.fulfill({ json: detailResForAge2 }),
      );

      await clickNthFilterIcon(page, 6);
      const selectAllButton2 = page.locator('#select-all');
      await selectAllButton2.click();

      const addFilterButton2 = page.getByTestId('add-filter');
      await addFilterButton2.click();

      const searchResult1 = mockData.content[5];
      const searchResult2 = mockData.content[6];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult1.conceptPath}`);
      const secondAddedFilter = page.getByTestId(`added-filter-${searchResult2.conceptPath}`);

      // Then
      await expect(firstAddedFilter).toBeVisible();
      // await expect(firstAddedFilter).toContainText(searchResult1.display);
      await expect(secondAddedFilter).toBeVisible();
      // await expect(secondAddedFilter).toContainText(searchResult2.display);
    });
    test('Fitlers with min and max display in the info panel', async ({ page }) => {
      // Given

      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createNumericFilter(
        mockData.content[2] as SearchResult,
        mockData.content[2]?.min?.toString(),
        mockData.content[2]?.max?.toString(),
      );
      await clickNthFilterIcon(page, 3);
      await page.getByTestId('min-input').fill(filter.min + '');
      await page.getByTestId('max-input').fill(filter.max + '');
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[3];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(
        `Restricting to between ${filter.min} and ${filter.max}.`,
      );
    });
    test('Fitlers with no min display less than text', async ({ page }) => {
      // Given

      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createNumericFilter(
        mockData.content[2] as SearchResult,
        mockData.content[2]?.min?.toString(),
        mockData.content[2]?.max?.toString(),
      );
      await clickNthFilterIcon(page, 3);
      await page.getByTestId('max-input').fill(filter.max + '');
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[3];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(`Restricting to less than ${filter.max}.`);
    });
    test('Fitlers with no max display greater than text', async ({ page }) => {
      // Given

      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createNumericFilter(
        mockData.content[2] as SearchResult,
        mockData.content[2].min?.toString(),
        mockData.content[2].max?.toString(),
      );
      await clickNthFilterIcon(page, 3);
      await page.getByTestId('min-input').fill(filter.min + '');
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[3];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(`Restricting to greater than ${filter.min}.`);
    });
    test('Fitlers where the min and max were left blank show the correct text', async ({
      page,
    }) => {
      // Given

      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page, 3);
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[3];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(`Restricting to any value.`);
    });
    test('Added Fitlers contain study acronym and dataset', async ({ page }) => {
      // Given
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page, 3);
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[3];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(
        `${searchResult.studyAcronym} (${searchResult.dataset})`,
      );
    });
    test('Clicking the remove button removes the filter from the results panel', async ({
      page,
    }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(firstAddedFilter).toBeVisible();

      // Then
      const removeButton = firstAddedFilter.locator('button').nth(1);
      await removeButton.click();
      await expect(firstAddedFilter).not.toBeVisible();
    });
    test('Clicking the edit button for a categorical filter opens the edit modal', async ({
      page,
    }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const edit = firstAddedFilter.locator('button').first();
      await edit.click();

      // Then
      const modal = page.getByTestId('modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('modal-wrapper-header')).toContainText('Edit Filter');
    });
    test('Edit modal maintains selected items', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      const firstValue = await firstItem.textContent();
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const edit = firstAddedFilter.locator('button').first();
      await edit.click();
      const modal = page.getByTestId('modal-component');
      const selectedOptionContainer = modal.locator('#selected-options-container');
      const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
      const firstSelectedOption = selectedOptions[0];

      // Then
      await expect(firstSelectedOption).toBeVisible();
      await expect(firstSelectedOption).toHaveText(firstValue);
    });
    test('Edit modal maintains info on the top', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      const edit = firstAddedFilter.locator('button').first();
      await edit.click();
      const modal = page.getByTestId('modal-component');
      const variableInfo = modal.locator('.variable-info');
      // Then
      await expect(variableInfo).toBeVisible();
      await expect(variableInfo).toContainText(`${searchResult.display}`);
      await expect(variableInfo).toContainText(`${searchResult.description}`);
      await expect(variableInfo).toContainText(
        `${searchResult.studyAcronym} (${searchResult.dataset})`,
      );
    });
    test('Edit modal changes the filter', async ({ page }) => {
      // Given
      await page.route(`${conceptsDetailPath}${detailResponseCat.dataset}`, async (route: Route) =>
        route.fulfill({ json: detailResponseCat }),
      );
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mockData.content[0];
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
      await firstAddedFilter.click();
      const firstValueString = await firstAddedFilter.locator('section').innerText();
      const edit = firstAddedFilter.locator('button').first();
      await edit.click();
      const modal = page.getByTestId('modal-component');
      const selectedOptionContainer = modal.locator('#selected-options-container');
      const firstUnslectedOption = await getOption(modal);
      await firstUnslectedOption.click();
      const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
      let valueString = '';
      for (const option of selectedOptions) {
        const comma = option !== selectedOptions[selectedOptions.length - 1] ? ', ' : '';
        valueString += `${await option.innerText()}${comma}`;
      }
      const addFilterButtoEdit = modal.getByTestId('add-filter');
      await addFilterButtoEdit.click();
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then

      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(`Restricting to ${selectedOptions.length} values.`);
      await expect(infoSection).toContainText(`Values:${valueString}`);
      await expect(infoSection).not.toContainText(firstValueString);
    });
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

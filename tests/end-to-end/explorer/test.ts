import { expect, type Route } from '@playwright/test';
import { test, mockApiFail, mockApiConfig } from '../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  detailResponseCatSameDataset,
  facetResultPath,
  facetsResponse,
  searchResults as mockData,
  searchResultPath,
  facetResponseWithZeroCount,
  hierarchyResponse,
} from '../mock-data';
import { type SearchResult } from '../../../src/lib/models/Search';
import {
  getOption,
  clickNthFilterIcon,
  optionsHaveLoaded,
  userIsLoggedIn,
  userIsLoggedOut,
} from '../utils';

test.describe('Explorer for authenticated users', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
      ],
    });
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
  });

  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

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
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Facets with zero count are hidden', async ({ page }) => {
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetResponseWithZeroCount }),
    );
    // Given
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#facet-side-bar')).toBeVisible();
    await expect(
      page
        .getByTestId('accordion-item')
        .first()
        .getByTestId(`facet-${facetResponseWithZeroCount[0].name}-label`),
    ).not.toBeVisible();
  });
  test('Can search with empty search bar', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#search-button')).not.toBeDisabled();
  });
  test('Has search result table when search is executed', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer');
    await userIsLoggedIn(page);

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
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test.describe('Search row actions', () => {
    // TODO: Some feartures will be hidden in the future. Cannot use nth.
    test.beforeEach(async ({ page }) => {
      await page.route(
        '*/**/picsure/proxy/dictionary-api/concepts/detail/' + mockData.content[0].dataset,
        async (route: Route) => route.fulfill({ json: detailResponseCat }),
      );
    });
    test.describe('Info Actions', () => {
      test('Clicking a row opens info panel', async ({ page }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();

        // Then
        const infoPanel = tableBody
          .locator('tr.expandable-row')
          .first()
          .getByTestId('variable-info');
        await expect(infoPanel).toBeVisible();
      });
      test('Clicking the row again closes the info panel', async ({ page }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        const tableBody = page.locator('tbody');
        await expect(tableBody).toBeVisible();
        const firstRow = tableBody.locator('tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();

        // Then
        const infoPanel = tableBody
          .locator('tr.expandable-row')
          .first()
          .getByTestId('variable-info');
        await expect(infoPanel).toBeVisible();

        // Then
        await firstRow.click();
        await expect(infoPanel).not.toBeVisible();
      });
      test('Clicking the info icon opens and then closes the info panel', async ({ page }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await expect(page.locator('tbody')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const infoIcon = firstRow.locator('td').last().locator('button').first();
        await expect(infoIcon).toBeVisible();
        await infoIcon.click();

        // Then
        const infoPanel = tableBody
          .locator('tr.expandable-row')
          .first()
          .getByTestId('variable-info');
        await expect(infoPanel).toBeVisible();

        // Then
        await infoIcon.click();
        await expect(infoPanel).not.toBeVisible();
      });
      test('Clicking the info icon opens the info panel with the correct information', async ({
        page,
      }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await expect(variableInfo).toContainText('Name: ' + detailResponseCat.display);
        await expect(variableInfo).toContainText('Accession: ' + detailResponseCat.name);
        await expect(variableInfo).toContainText('Type: ' + detailResponseCat.type);
        await expect(variableInfo).toContainText('Description: ' + detailResponseCat.description);

        // Check Dataset Information
        const datasetInfo = infoPanel.getByTestId('dataset-info');
        await expect(datasetInfo.getByText('Dataset Information')).toBeVisible();
        await expect(datasetInfo).toContainText('Name: ' + detailResponseCat.table.display);
        await expect(datasetInfo).toContainText('Accession: ' + detailResponseCat.table.name);
        await expect(datasetInfo).toContainText(
          'Description: ' + detailResponseCat.table.description,
        );

        // Check Study Information
        const studyInfo = infoPanel.getByTestId('study-info');
        await expect(studyInfo.getByText('Study Information')).toBeVisible();
        await expect(studyInfo).toContainText('Study Name: ' + detailResponseCat.study.fullName);
        await expect(studyInfo).toContainText('Study Accession: ' + detailResponseCat.study.ref);
      });
      test('Clicking a filter button opens the filter panel & then clicking another row opens the info panel', async ({
        page,
      }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        const tableBody = page.locator('tbody');
        await clickNthFilterIcon(page);
        const filterPanel = tableBody.getByTestId('filter-component');
        await expect(filterPanel).toBeVisible();
        const thirdRow = tableBody.locator('tr').nth(2); // need 2 because expandable row is 1
        await expect(thirdRow).toBeVisible();
        await thirdRow.click();
        await page.waitForTimeout(1000);

        // Then
        const infoPanel = tableBody.locator('tr.expandable-row').getByTestId('variable-info');
        await expect(infoPanel).toBeVisible();
        await expect(filterPanel).not.toBeVisible();
      });
    });
    test.describe('Filter Actions', () => {
      test('Clicking the filter button opens and then closes the filter panel', async ({
        page,
      }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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

        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.route(
          '*/**/picsure/proxy/dictionary-api/concepts/detail/' + row.dataset,
          async (route: Route) => route.fulfill({ body: JSON.stringify(row) }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await clickNthFilterIcon(page, 0);
        await optionsHaveLoaded(page);

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

        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.route(
          '*/**/picsure/proxy/dictionary-api/concepts/detail/' + row.dataset,
          async (route: Route) => route.fulfill({ body: JSON.stringify(row) }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
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
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat }),
        );
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await clickNthFilterIcon(page);
        const firstItem = await getOption(page);

        // Then
        const firstItemText: string | null = await firstItem.textContent();
        expect(firstItemText?.trim()).toBe(detailResponseCat.values[0]);
        // Close the filter panel
        await clickNthFilterIcon(page);

        // Then Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCatSameDataset }),
        );
        // When
        await clickNthFilterIcon(page, 1);

        const secondItem = await getOption(page);
        // Then
        const secondItemText: string | null = await secondItem.textContent();
        expect(secondItemText?.trim()).toBe(detailResponseCatSameDataset.values[0]);
      });
      test('The dictionary details are cached', async ({ page }) => {
        // Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat }),
        );
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await clickNthFilterIcon(page);
        let firstItem = await getOption(page);

        // Then
        const firstItemText: string | null = await firstItem.textContent();
        expect(firstItemText?.trim()).toBe(detailResponseCat.values[0]);
        // Close the filter panel and wait for it to fully disappear
        await clickNthFilterIcon(page);
        await expect(page.getByTestId('optional-selection-list')).toHaveCount(0);

        // Then Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCatSameDataset }),
        );
        // When
        await clickNthFilterIcon(page, 1);

        const secondItem = await getOption(page);
        // Then
        const secondItemText: string | null = await secondItem.textContent();
        expect(secondItemText?.trim()).toBe(detailResponseCatSameDataset.values[0]);

        // Then Given
        // This should not be hit so I am putting detailResponseCat2 which is wrong
        await clickNthFilterIcon(page, 1);
        await expect(page.getByTestId('optional-selection-list')).toHaveCount(0);
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat2 }),
        );

        // When
        await clickNthFilterIcon(page, 0);
        firstItem = await getOption(page);
        // Then
        const sameString: string | null = await firstItem.textContent();
        expect(sameString?.trim()).toBe(detailResponseCat.values[0]);
        expect(sameString?.trim()).toBe(firstItemText?.trim());
      });
    });
    test.describe('Export Actions', () => {
      test('Clicking the export button flips the icon', async ({ page }) => {
        // Given
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

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
    test.describe('Hierarchy Actions', () => {
      test.beforeEach(async ({ page }) => {
        await page.route('*/**/picsure/v3/query/sync', async (route: Route) =>
          route.fulfill({ body: '9999' }),
        );
        await page.route(
          '*/**/picsure/proxy/dictionary-api/concepts/hierarchy/test_data_set',
          async (route: Route) => route.fulfill({ json: hierarchyResponse }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        // When
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const hierarchyButton = firstRow.locator('td').last().locator('button').nth(2);
        await hierarchyButton.click();
      });
      test('Hierarchy component shows when action button clicked', async ({ page }) => {
        // When
        await expect(page.locator('tbody')).toBeVisible();
        // Then
        await expect(page.getByTestId('hierarchy-component')).toBeVisible();
      });
      test('Hierarchy component is not visible when action button is clicked again', async ({
        page,
      }) => {
        // When
        await expect(page.getByTestId('hierarchy-component')).toBeVisible();
        const tableBody = page.locator('tbody');
        const firstRow = tableBody.locator('tr').first();
        const hierarchyButton = firstRow.locator('td').last().locator('button').nth(2);
        await hierarchyButton.click();
        // Then
        await expect(page.getByTestId('hierarchy-component')).not.toBeVisible();
      });
      test('Hierarchy component data is expected', async ({ page }) => {
        // Then
        await expect(page.getByTestId('hierarchy-component')).toBeVisible();
        const hierarchyComponent = page.getByTestId('hierarchy-component');
        const treeItems = await hierarchyComponent.locator('details').all();
        const conceptPathItems = hierarchyResponse.reverse();
        for (let i = 0; i < conceptPathItems.length; i++) {
          const treeItem = treeItems[i];
          const treeItemText = await treeItem.locator('> summary label').textContent();
          expect(treeItemText).toContain(conceptPathItems[i].display);
          expect(treeItemText).toContain(conceptPathItems[i].name);
        }
      });
      test("Hierarchy component's last item is the only one selected", async ({ page }) => {
        // Then
        const allRadioButtons = await page
          .locator('details')
          .locator('summary')
          .locator('input')
          .all();
        for (let i = 0; i < allRadioButtons.length - 1; i++) {
          if (i === allRadioButtons.length) {
            await expect(allRadioButtons[i]).toBeChecked();
          } else {
            await expect(allRadioButtons[i]).not.toBeChecked();
          }
        }
      });
      test("Hierarchy component's last radio buttons are selectable", async ({ page }) => {
        // Then
        const allRadioButtons = await page
          .locator('details')
          .locator('summary')
          .locator('input')
          .all();
        for (let i = 0; i < allRadioButtons.length; i++) {
          await allRadioButtons[i].click();
          await expect(allRadioButtons[i]).toBeChecked();
        }
      });
    });
  });
});

test.describe('Explorer for unauthenticated users', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test('Unauthenticated user can access explorer without being redirected to login', async ({
    page,
  }) => {
    // Given
    // OPEN + OPEN_EXPLORER together are what let an unauthenticated user reach
    // /explorer and use it directly, per "Explore Without Login" (see internal docs):
    // unauthenticated OPEN_EXPLORER users get full search/facets/filtering/genomic/
    // visualization access on this page, with no login gate.
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'true' },
      ],
    });
    await page.goto('/explorer');

    // Then
    await expect(page).toHaveURL('/explorer');
    await userIsLoggedOut(page);
    await expect(page.locator('#search-bar')).toBeVisible();
  });

  test('User is prompted to login if not authenticated and explorer is not open', async ({
    page,
  }) => {
    // Given
    // Without OPEN_EXPLORER, /explorer's own layout redirects unauthenticated
    // users to /login (see explorer/+layout.ts).
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
      ],
    });
    await page.goto('/explorer');

    // Then
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fexplorer/);
  });
});

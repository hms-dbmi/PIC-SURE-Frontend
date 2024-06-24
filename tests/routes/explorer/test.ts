import { expect, type Route } from '@playwright/test';
import { test, mockApiFail } from '../../custom-context';
import { searchResults as mockData, searchResultPath } from '../../mock-data';
import { mapSearchResults, type SearchResult } from '../../../src/lib/models/Search';
import { createCategoricalFilter, createNumericFilter } from '../../../src/lib/models/Filter';

const firstId = 'tag-dataset-nhanes';
const secondId = 'tag-dataset-1000_genomes';

test.describe('explorer', () => {
  test('Has datatable, filters, and searchbar', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.goto('/explorer');

    // Then
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#search-tags')).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await mockApiFail(page, searchResultPath, 'accessdenied');
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test.describe('Search Refinements', () => {
    test('Tag toggles included icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-include`);
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Included state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'true');
    });
    test('Tag toggles included icon off', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-include`);
      await tag.click(); // to Included state
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Default state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles excluded icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-exclude`);
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Excluded state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'true');
    });
    test('Tag toggles excluded icon off', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-exclude`);
      await tag.click(); // to Excluded state
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Default state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles excluded icon off and included icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const excludeTag = page.locator(`#${firstId}-exclude`);
      await excludeTag.click(); // to Excluded state
      await expect(excludeTag).toHaveAttribute('aria-checked', 'true');

      //When
      const includeTag = page.locator(`#${firstId}-include`);
      await includeTag.click(); // to Included state

      // Then
      await expect(includeTag).toHaveAttribute('aria-checked', 'true');
      await expect(excludeTag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles included icon off and excluded icon on', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const includeTag = page.locator(`#${firstId}-include`);
      await includeTag.click(); // to Included state
      await expect(includeTag).toHaveAttribute('aria-checked', 'true');

      //When
      const excludeTag = page.locator(`#${firstId}-exclude`);
      await excludeTag.click(); // to Excluded state

      // Then
      await expect(excludeTag).toHaveAttribute('aria-checked', 'true');
      await expect(includeTag).toHaveAttribute('aria-checked', 'false');
    });
  });
  test.describe('#search-tags keyboard navigation', () => {
    test('Can tab between checkbox groups', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();

      // When
      await page.keyboard.press('Tab');

      // Then
      await expect(page.locator(`#${firstId}-include`)).not.toBeFocused();
      await expect(page.locator(`#${secondId}-include`)).toBeFocused();
    });
    test('Gives visual indicator of focus to parent container', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();

      // When
      await page.keyboard.press('Tab');

      // Then
      await expect(page.getByTestId(secondId)).toHaveClass(/key-focus/);
    });
    test('Can select Include checkbox with + key', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('+');

      // Then
      await expect(page.locator(`#${secondId}-include`)).toHaveAttribute('aria-checked', 'true');
    });
    test('Can select Exclude checkbox with - key', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('-');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toHaveAttribute('aria-checked', 'true');
    });
    test('Can move between checkboxes with left arrow key', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowRight');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toBeFocused();
    });
    test('Can move between checkboxes with right arrow key', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowLeft');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toBeFocused();
    });
    test('Space key checks checkbox', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press(' ');

      // Then
      await expect(page.locator(`#${secondId}-include`)).toHaveAttribute('aria-checked', 'true');
    });
    test('Enter key checks checkbox', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toHaveAttribute('aria-checked', 'true');
    });
  });
  test.describe('Results Panel', () => {
    test('Result panel bar and button shows', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.goto('/explorer?search=somedata');

      // Then
      await expect(page.locator('#side-panel-bar')).toBeVisible();
      await expect(page.locator('#results-panel-toggle')).toBeVisible();
      await page.locator('#results-panel-toggle').click();
    });
    test('Result toggle button opens and closes the results panel', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
    test('Result panel shows 0 results on an error', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      // Then
      await expect(page.locator('#result-count')).toBeVisible();
      await expect(page.locator('#result-count')).toHaveText('0');
    });
    test('Result panel shows the correct number of results', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      // Then
      await expect(page.locator('#result-count')).toBeVisible();
      await expect(page.locator('#result-count')).not.toHaveText('0');
    });
    test('Result panel shows no filters added when there are no filters', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      // Then
      await expect(page.getByText('No filters added')).toBeVisible();
    });
    test('Export button hidden when no filters or exports are added', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await page.locator('#results-panel-toggle').click();

      // Then
      await expect(page.getByText('No filters added')).toBeVisible();
      await expect(page.locator('#export-data-button')).not.toBeVisible();
    });
    test('Export button hidden when count is 0', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '0' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await page.locator('#results-panel-toggle').click();

      // Then
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(page.locator('#export-data-button')).not.toBeVisible();
    });
    test('Export button hidden when count is not 0 and there is no filters', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );

      // When
      await page.goto('/explorer?search=somedata');
      await page.locator('#results-panel-toggle').click();

      // Then
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(page.locator('#export-data-button')).not.toBeVisible();
    });
  });
  test.describe('Search row actions', () => {
    // TODO: Some feartures will be hidden in the future. Cannot use nth.
    test('Clicking a row opens info panel', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
    test('Clicking the filter button opens and then closes the filter panel', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page);
      const mockdataType = mockData.results.phenotypes['\\some\\test\\lab1\\'].categorical;

      // Then
      const tableBody = page.locator('tbody');
      const panel = tableBody.locator('tr.expandable-row').first();
      await expect(panel).toBeVisible();
      if (mockdataType) {
        await expect(page.getByTestId('categoical-filter')).toBeVisible();
      } else {
        await expect(page.getByTestId('numerical-filter')).toBeVisible();
      }
    });
    test('Clicking the filter button opens the correct filter panel (numerical)', async ({
      page,
    }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await clickNthFilterIcon(page, 2);
      const mockdataType = mockData.results.phenotypes['\\some\\test\\numerical\\'].categorical;

      // Then
      const tableBody = page.locator('tbody');
      const panel = tableBody.locator('tr.expandable-row').first();
      await expect(panel).toBeVisible();
      if (mockdataType) {
        await expect(page.getByTestId('categoical-filter')).toBeVisible();
      } else {
        await expect(page.getByTestId('numerical-filter')).toBeVisible();
      }
    });
    test('Clicking the export button flips the icon', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await expect(page.locator('#\\\\some\\\\test\\\\lab1\\\\')).toBeVisible();
    });
    test('Clicking an export remove button removes the export', async ({ page }) => {
      //todo check remove button class
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const removeButton = page.locator('#\\\\some\\\\test\\\\lab1\\\\').locator('button');
      removeButton.click();
      // Then
      await expect(page.getByTestId('export-header')).not.toBeVisible();
      await expect(page.locator('#\\\\some\\\\test\\\\lab1\\\\')).not.toBeVisible();
    });
    test('Clicking a second export adds a second export', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await expect(page.locator('#\\\\some\\\\test\\\\lab1\\\\')).toBeVisible();
      await expect(page.locator('#\\\\some\\\\test\\\\lab2\\\\')).toBeVisible();
    });
    test('Exports remmain after closing and opening the results panel', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await expect(page.locator('#\\\\some\\\\test\\\\lab1\\\\')).toBeVisible();
      await expect(page.locator('#\\\\some\\\\test\\\\lab2\\\\')).toBeVisible();
    });
    test('Hierarchy component shows when action button clicked', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      await expect(page.locator('tbody')).toBeVisible();
      const tableBody = page.locator('tbody');
      const firstRow = tableBody.locator('tr').first();
      const hierarchyButton = firstRow.locator('td').last().locator('button').nth(2);
      await hierarchyButton.click();

      // Then
      await expect(page.getByTestId('hierarchy-component')).toBeVisible();
    });
  });
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
      const firstValues = mockData.results.phenotypes['\\some\\test\\lab1\\'].categoryValues.slice(
        0,
        20,
      );

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
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');
      const dataValues = mockData.results.phenotypes['\\some\\test\\lab1\\'].categoryValues;

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
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');
      await clickNthFilterIcon(page);
      const component = page.getByTestId('optional-selection-list');
      const optionContainer = component.locator('#options-container');
      const selectedOptionContainer = component.locator('#selected-options-container');
      const option =
        '#option-' + getId(mockData.results.phenotypes['\\some\\test\\lab1\\'].categoryValues[0]);

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
  test.describe('Add Filters', () => {
    test('Add button is disabled when nothing is selected', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult: SearchResult = mapSearchResults(
        mockData.results.phenotypes['\\some\\test\\lab1\\'],
      );
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);

      // Then
      await expect(page.locator('#results-panel')).toBeVisible();
      await expect(firstAddedFilter).toBeVisible();
    });
    test('Added Filter has expected buttons', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(openButton.locator('i')).toHaveClass(/fa-caret-down/);
    });
    test('Clicking open filter closes the more info section', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createCategoricalFilter(
        mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']),
        mockData.results.phenotypes['\\some\\test\\lab1\\'].categoryValues.slice(0, 1),
      );
      await clickNthFilterIcon(page);
      const firstItem = await getOption(page);
      await firstItem.click();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText('Restricting to any value.');
    });
    test('Fitlers with min and max display in the info panel', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createNumericFilter(
        mapSearchResults(mockData.results.phenotypes['\\some\\test\\numerical\\']),
        mockData.results.phenotypes['\\some\\test\\numerical\\'].min.toString(),
        mockData.results.phenotypes['\\some\\test\\numerical\\'].max.toString(),
      );
      await clickNthFilterIcon(page, 2);
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mapSearchResults(
        mockData.results.phenotypes['\\some\\test\\numerical\\'],
      );
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createNumericFilter(
        mapSearchResults(mockData.results.phenotypes['\\some\\test\\numerical\\']),
        mockData.results.phenotypes['\\some\\test\\numerical\\'].min.toString(),
        mockData.results.phenotypes['\\some\\test\\numerical\\'].max.toString(),
      );
      await clickNthFilterIcon(page, 2);
      const minInput = page.getByTestId('min-input');
      await minInput.clear();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mapSearchResults(
        mockData.results.phenotypes['\\some\\test\\numerical\\'],
      );
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(`Restricting to less than ${filter.max}.`);
    });
    test('Fitlers with no max display greater than text', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
      await page.route('*/**/picsure/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await page.goto('/explorer?search=somedata');

      // When
      const filter = createNumericFilter(
        mapSearchResults(mockData.results.phenotypes['\\some\\test\\numerical\\']),
        mockData.results.phenotypes['\\some\\test\\numerical\\'].min.toString(),
        mockData.results.phenotypes['\\some\\test\\numerical\\'].max.toString(),
      );
      await clickNthFilterIcon(page, 2);
      const maxInput = page.getByTestId('max-input');
      await maxInput.clear();
      const addFilterButton = page.getByTestId('add-filter');
      await addFilterButton.click();
      const searchResult = mapSearchResults(
        mockData.results.phenotypes['\\some\\test\\numerical\\'],
      );
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
      const openButton = firstAddedFilter.locator('button').last();
      await openButton.click();

      // Then
      const infoSection = firstAddedFilter.locator('section');
      await expect(infoSection).toBeVisible();
      await expect(infoSection).toContainText(`Restricting to greater than ${filter.min}.`);
    });
    test('Clicking the remove button removes the filter from the results panel', async ({
      page,
    }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
      const edit = firstAddedFilter.locator('button').first();
      await edit.click();

      // Then
      const modal = page.getByTestId('modal-component');
      await expect(modal).toBeVisible();
      await expect(modal.getByTestId('modal-wrapper-header')).toContainText('Edit Filter');
    });
    test('Edit modal maintains selected items', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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
    test('Edit modal changes the filter', async ({ page }) => {
      // Given
      await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
      const searchResult = mapSearchResults(mockData.results.phenotypes['\\some\\test\\lab1\\']);
      const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.name}`);
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

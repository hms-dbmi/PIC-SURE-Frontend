import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';

import {
  conceptTreePath,
  conceptsDetailPath,
  detailResponseCat,
  facetResultPath,
  facetsResponse,
  searchResults as mockData,
  searchResultPath,
  detailResForAge,
  detailResForAge2,
  mockDataWithChildren,
} from '../../mock-data';
import { getOption, clickNthFilterIcon } from '../../utils';
import { createCategoricalFilter, createNumericFilter } from '../../../../src/lib/models/Filter';
import type { SearchResult } from '../../../../src/lib/models/Search';

const countResultPath = '*/**/picsure/v3/query/sync';

test.beforeEach(async ({ page }) => {
  await mockApiSuccess(page, searchResultPath, mockData);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
});

test.describe('Add Filters', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test('Add button is disabled when nothing is selected', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);

    // Then
    await expect(page.getByTestId('add-filter')).toBeVisible();
    await expect(page.getByTestId('add-filter')).toBeDisabled();
  });
  test('Add button is enabled when something is selected', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${mockData.content[5].dataset}`,
      detailResForAge,
    );
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page, 5);
    const selectAllButton = page.locator('#select-all');
    await selectAllButton.click();

    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();

    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${mockData.content[5].dataset}`,
      detailResForAge2,
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
    await expect(secondAddedFilter).toBeVisible();
  });
  test('Fitlers with min and max display in the info panel', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(page, countResultPath, '9999');
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
  test('Fitlers where the min and max were left blank show the correct text', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(page, countResultPath, '9999');
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
  test('Clicking the remove button removes the filter from the results panel', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    const modal = page.locator('#modal-component');
    await expect(modal).toBeVisible();
    await expect(modal.getByTestId('modal-wrapper-header')).toContainText('Edit Filter');
  });
  test('Edit modal maintains selected items', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    const modal = page.locator('#modal-component');
    const selectedOptionContainer = modal.locator('#selected-options-container');
    const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
    const firstSelectedOption = selectedOptions[0];

    // Then
    await expect(firstSelectedOption).toBeVisible();
    await expect(firstSelectedOption).toHaveText(firstValue);
  });
  test('Edit modal maintains info on the top', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    const modal = page.locator('#modal-component');
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
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, countResultPath, '9999');
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
    const modal = page.locator('#modal-component');
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
test.describe('Any record of filter', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await mockApiSuccess(
      page,
      `${conceptTreePath}/${mockData.content[0].dataset}?depth=100`,
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
  test('Adding an any record of filter adds the filter to the results panel', async ({ page }) => {
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
  test('If there is only Any Record of filter, the distributions button is hidden', async ({
    page,
  }) => {
    await expect(page.getByTestId('distributions-btn')).not.toBeVisible();
  });
});
test.describe('User with no query scopes can add filters without error', () => {
  const outOfScopeStudy = 7;
  test.use({ storageState: 'tests/end-to-end/.auth/noScopeUser.json' });

  test('User can prepare data for analysis', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');

    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page, outOfScopeStudy);
    await page.getByTestId('add-filter').click();
    await page.locator('#export-data-button').click();

    // Then
    await expect(page.locator('#discover-error-container')).not.toBeVisible();
  });
  test('User can view variable distirubtions', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');

    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page, outOfScopeStudy);
    await page.getByTestId('add-filter').click();
    await page.getByTestId('distributions-btn').click();

    // Then
    await expect(page.locator('#discover-error-container')).not.toBeVisible();
  });
});
test.describe('Query V3 OR features', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/noScopeUser.json' });
  let querySyncRequest: string[] = [];

  test.beforeEach(({ page }) => {
    page.on('request', (request) => {
      if (request.url().includes('/picsure/v3/query/sync')) {
        const data = request.postData();
        if (data !== null) {
          querySyncRequest.push(data);
        }
      }
    });
  });

  test.afterEach(() => {
    querySyncRequest = [];
  });
  test('sends request with QueryV3 structure', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await page.goto('/explorer?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();

    // Then
    expect(querySyncRequest.length).toBe(1);
    expect(querySyncRequest[0]).toContain('phenotypicClauses');
  });
  test('does not have dropdowns on explorer', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');
    await page.goto('/explorer?search=somedata');

    // When
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${mockData.content[5].dataset}`,
      detailResForAge,
    );
    await clickNthFilterIcon(page, 5);
    const selectAllButton = page.locator('#select-all');
    await selectAllButton.click();
    const addFilterButton = page.getByTestId('add-filter');
    await addFilterButton.click();

    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${mockData.content[5].dataset}`,
      detailResForAge2,
    );
    await clickNthFilterIcon(page, 6);
    const selectAllButton2 = page.locator('#select-all');
    await selectAllButton2.click();
    const addFilterButton2 = page.getByTestId('add-filter');
    await addFilterButton2.click();

    // Then
    const filters = await page.locator('#export-filters .operator-select').all();
    expect(filters.length).toBe(0);
  });
});

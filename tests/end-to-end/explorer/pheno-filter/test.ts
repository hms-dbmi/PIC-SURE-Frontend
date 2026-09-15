import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';

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
  hierarchyResponse,
} from '../../mock-data';
import { getOption, optionsHaveLoaded, userIsLoggedIn } from '../../utils';
import {
  createCategoricalFilter,
  createNumericFilter,
} from '../../../../src/lib/models/Filter.svelte';
import type { SearchResult } from '../../../../src/lib/models/Search';

const countResultPath = '*/**/picsure/hpds/auth/v3/query/sync';

/*
 * Adding a phenotypic filter, and what the cohort panel does with it.
 *
 * These cases used to open the filter interface from the per-row Filter icon on the search
 * results, which ALS-12881 removes: a user picks values on the variable's own detail page now,
 * so that is where the filters here are added from. What happens afterwards - the chip, its
 * buttons, its summary text, the edit modal, the query that goes out - is unchanged, and is
 * still what most of these cases are about.
 *
 * The detail page is addressed by URL, carrying the dataset and the concept path because
 * concept detail needs both.
 */
const detailUrl = (dataset: string, conceptPath: string) =>
  `/explorer/variable/${encodeURIComponent(dataset)}/${encodeURIComponent(conceptPath)}`;

type Concept = { conceptPath: string; dataset: string };

/**
 * Answers concept detail for each of `concepts`, keyed on the concept path in the request
 * body.
 *
 * Keyed on the body rather than on the URL because the route carries only the dataset, and
 * two of these fixtures share one. The earlier entry wins, so a purpose-built detail fixture
 * takes precedence over the search result at the same path.
 */
const mockConcepts = (page: Page, concepts: unknown[]) =>
  page.route(`${conceptsDetailPath}/*`, (route: Route) => {
    const requested = route.request().postData() ?? '';
    const match = (concepts as Concept[]).find((concept) => concept.conceptPath === requested);
    return route.fulfill({ json: match ?? {} });
  });

/** Every concept these specs open, purpose-built fixtures first. */
const ALL_CONCEPTS = [
  detailResponseCat,
  detailResForAge,
  detailResForAge2,
  ...mockData.content,
] as unknown[];

const filterParticipants = (page: Page) => page.getByTestId('filter-participants');

/** Opens a variable's detail page from cold, with its filter panel rendered. */
async function openVariable(page: Page, concept: Concept) {
  await page.goto(detailUrl(concept.dataset, concept.conceptPath));
  await userIsLoggedIn(page);
  await expect(page.getByTestId('variable-filter-panel')).toBeVisible();
}

/** Picks the variable's first value, so that the action has something to filter on. */
async function pickFirstValue(page: Page): Promise<Locator> {
  const firstItem = await getOption(page);
  await firstItem.click();
  return firstItem;
}

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page, {
    features: [
      { name: 'ENABLE_HIERARCHY', value: 'true' },
      { name: 'ALLOW_EXPORT', value: 'true' },
      { name: 'DIST_EXPLORER', value: 'true' },
    ],
  });
  await mockApiSuccess(page, searchResultPath, mockData);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  // The detail page renders the hierarchy where the deployment enables it, which this config
  // does, so it has something to answer with rather than an error in that card.
  await mockApiSuccess(page, '*/**/picsure/dictionary/concepts/hierarchy/*', hierarchyResponse);
});

test.describe('Add Filters', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockConcepts(page, ALL_CONCEPTS);
    await mockApiSuccess(page, countResultPath, '9999');
  });

  test('Add button is disabled when nothing is selected', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // Then
    await expect(filterParticipants(page)).toBeVisible();
    await expect(filterParticipants(page)).toBeDisabled();
  });

  test('Add button is enabled when something is selected', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);

    // Then
    await expect(filterParticipants(page)).toBeEnabled();
  });

  test('Clicking the add button opens the results panel', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
  });

  test('Clicking the add button adds the filter to the results panel', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
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
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
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
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
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
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
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
    await openVariable(page, detailResponseCat);

    // When
    const filter = createCategoricalFilter(
      mockData.content[0] as SearchResult,
      mockData.content[0]?.values?.slice(0, 1) || [],
    );
    await pickFirstValue(page);
    await filterParticipants(page).click();
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
    await openVariable(page, detailResponseCat);

    // When
    const component = page.getByTestId('optional-selection-list');
    await optionsHaveLoaded(page);
    const selectAllButton = component.locator('#select-all');
    await selectAllButton.click();

    await filterParticipants(page).click();
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
    // Given two variables in one dataset that share a display name
    await openVariable(page, detailResForAge);

    // When
    await page.locator('#select-all').click();
    await filterParticipants(page).click();

    await openVariable(page, detailResForAge2);
    await page.locator('#select-all').click();
    await filterParticipants(page).click();

    const firstAddedFilter = page.getByTestId(`added-filter-${detailResForAge.conceptPath}`);
    const secondAddedFilter = page.getByTestId(`added-filter-${detailResForAge2.conceptPath}`);

    // Then
    await expect(firstAddedFilter).toBeVisible();
    await expect(secondAddedFilter).toBeVisible();
  });

  /*
   * The four numeric cases below open `mockData.content[3]`, the continuous variable whose
   * bounds they fill in. They used to build the expected filter from `content[2]` - a
   * categorical variable with no `min` or `max` - so the inputs were filled with the string
   * "undefined" and the assertions read "Restricting to between undefined and undefined".
   * They passed, and could not have told a working min/max interface from a broken one.
   */
  const continuousVariable = mockData.content[3] as SearchResult;

  test('Fitlers with min and max display in the info panel', async ({ page }) => {
    // Given
    await openVariable(page, continuousVariable);

    // When
    const filter = createNumericFilter(
      continuousVariable,
      continuousVariable.min?.toString(),
      continuousVariable.max?.toString(),
    );
    await page.getByTestId('min-input').fill(filter.min + '');
    await page.getByTestId('max-input').fill(filter.max + '');
    await filterParticipants(page).click();
    const firstAddedFilter = page.getByTestId(`added-filter-${continuousVariable.conceptPath}`);
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
    await openVariable(page, continuousVariable);

    // When
    const filter = createNumericFilter(
      continuousVariable,
      continuousVariable.min?.toString(),
      continuousVariable.max?.toString(),
    );
    await page.getByTestId('max-input').fill(filter.max + '');
    await filterParticipants(page).click();
    const firstAddedFilter = page.getByTestId(`added-filter-${continuousVariable.conceptPath}`);
    const openButton = firstAddedFilter.locator('button').last();
    await openButton.click();

    // Then
    const infoSection = firstAddedFilter.locator('section');
    await expect(infoSection).toBeVisible();
    await expect(infoSection).toContainText(`Restricting to less than ${filter.max}.`);
  });

  test('Fitlers with no max display greater than text', async ({ page }) => {
    // Given
    await openVariable(page, continuousVariable);

    // When
    const filter = createNumericFilter(
      continuousVariable,
      continuousVariable.min?.toString(),
      continuousVariable.max?.toString(),
    );
    await page.getByTestId('min-input').fill(filter.min + '');
    await filterParticipants(page).click();
    const firstAddedFilter = page.getByTestId(`added-filter-${continuousVariable.conceptPath}`);
    const openButton = firstAddedFilter.locator('button').last();
    await openButton.click();

    // Then
    const infoSection = firstAddedFilter.locator('section');
    await expect(infoSection).toBeVisible();
    await expect(infoSection).toContainText(`Restricting to greater than ${filter.min}.`);
  });

  test('Fitlers where the min and max were left blank show the correct text', async ({ page }) => {
    // Given
    await openVariable(page, continuousVariable);

    // When
    await filterParticipants(page).click();
    const firstAddedFilter = page.getByTestId(`added-filter-${continuousVariable.conceptPath}`);
    const openButton = firstAddedFilter.locator('button').last();
    await openButton.click();

    // Then
    const infoSection = firstAddedFilter.locator('section');
    await expect(infoSection).toBeVisible();
    await expect(infoSection).toContainText(`Restricting to any value.`);
  });

  test('Added Fitlers contain study acronym and dataset', async ({ page }) => {
    // Given
    await openVariable(page, continuousVariable);

    // When
    await filterParticipants(page).click();
    const firstAddedFilter = page.getByTestId(`added-filter-${continuousVariable.conceptPath}`);
    const openButton = firstAddedFilter.locator('button').last();
    await openButton.click();

    // Then
    const infoSection = firstAddedFilter.locator('section');
    await expect(infoSection).toBeVisible();
    await expect(infoSection).toContainText(
      `${continuousVariable.studyAcronym} (${continuousVariable.dataset})`,
    );
  });

  test('Clicking the remove button removes the filter from the results panel', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
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
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
    const searchResult = mockData.content[0];
    const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
    await expect(firstAddedFilter).toBeVisible();
    const edit = firstAddedFilter.locator('button').first();
    await edit.click();

    // Then
    const modal = page.locator('#modal-component');
    await expect(modal).toBeVisible();
    await expect(modal.getByTestId('modal-wrapper-header')).toContainText('Edit Filter');
  });

  test('Edit modal maintains selected items', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    const firstItem = await getOption(page);
    const firstValue: string | null = await firstItem.textContent();
    expect(firstValue).not.toBeNull();
    await firstItem.click();
    await filterParticipants(page).click();
    const searchResult = mockData.content[0];
    const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
    await expect(firstAddedFilter).toBeVisible();
    const edit = firstAddedFilter.locator('button').first();
    await edit.click();
    const modal = page.locator('#modal-component');
    const selectedOptionContainer = modal.locator('#selected-options-container');
    const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
    const firstSelectedOption = selectedOptions[0];

    // Then
    await expect(firstSelectedOption).toBeVisible();
    await expect(firstSelectedOption).toHaveText(firstValue?.trim() || 'NULL');
  });

  // The modal's own Variable Name / Description / Study block. The detail page no longer
  // renders one - it would be a second copy of its own header - but the modal opens over the
  // cohort panel, where nothing else says which variable is being edited.
  test('Edit modal maintains info on the top', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
    const searchResult = mockData.content[0];
    const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
    await expect(firstAddedFilter).toBeVisible();
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
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();
    const searchResult = mockData.content[0];
    const firstAddedFilter = page.getByTestId(`added-filter-${searchResult.conceptPath}`);
    await expect(firstAddedFilter).toBeVisible();
    await firstAddedFilter.click();
    const section = firstAddedFilter.locator('section');
    await expect(section).toBeVisible();
    const firstValueString = await section.innerText();
    const edit = firstAddedFilter.locator('button').first();
    await edit.click();
    const modal = page.locator('#modal-component');
    await expect(modal).toBeVisible();
    const selectedOptionContainer = modal.locator('#selected-options-container');
    const firstUnslectedOption = await getOption(modal);
    await firstUnslectedOption.click();
    const selectedOptions = await selectedOptionContainer.getByRole('listitem').all();
    let valueString = '';
    for (const option of selectedOptions) {
      const comma = option !== selectedOptions[selectedOptions.length - 1] ? ', ' : '';
      valueString += `${(await option.innerText()).trim()}${comma}`;
    }
    const addFilterButtoEdit = modal.getByTestId('add-filter');
    await addFilterButtoEdit.click();
    const openButton = firstAddedFilter.locator('button').last();
    await openButton.click();

    // Then
    const infoSection = firstAddedFilter.locator('section');
    await expect(infoSection).toBeVisible();
    await expect(infoSection).toContainText(`Restricting to ${selectedOptions.length} values.`);
    await expect(infoSection).toContainText(`Values: ${valueString}`);
    await expect(infoSection).not.toContainText(firstValueString);
  });
});

test.describe('Any record of filter', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, countResultPath, '9999');
    await mockConcepts(page, ALL_CONCEPTS);
    await mockApiSuccess(
      page,
      `${conceptTreePath}/${mockData.content[0].dataset}?depth=100`,
      mockDataWithChildren,
    );
    await page.route(
      '*/**/picsure/dictionary/concepts/hierarchy/test_data_set',
      async (route: Route) => route.fulfill({ json: hierarchyResponse }),
    );

    // The hierarchy is on the variable's own page now, alongside the value list, rather than
    // behind a row icon.
    await openVariable(page, detailResponseCat);
    await expect(page.getByTestId('hierarchy-component')).toBeVisible();
    const secondItem = page.getByTestId('radio:Disease (disease)');
    await secondItem.click();
    // The hierarchy's own add button, which no longer shares a test id with the value list's
    const addFilterButton = page.getByTestId('add-hierarchy-filter');
    await addFilterButton.click();
    await expect(page.locator('#modal-component')).not.toBeVisible();
    await expect(page.getByTestId(/^any-record-of-filter-modal-.*-btn$/)).toBeVisible();
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
    const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*-btn$/);
    await addedFilter.click();
    await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible();
  });
  test('Clicking the Any Record of filter modal has the correct number of variables', async ({
    page,
  }) => {
    const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*-btn$/);
    await expect(addedFilter).toBeVisible({ timeout: 5000 });
    // Retry click — click-outside handler can dismiss the modal on the same pointer event
    await expect(async () => {
      await addedFilter.click();
      await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    const h1 = page.getByTestId('any-record-of-filter-modal').locator('header').locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(
      `${mockDataWithChildren.children.length} variable(s) in disease category`,
    );
  });
  test('Clicking the Any Record of filter modal has the correct variables', async ({ page }) => {
    const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*-btn$/);
    await addedFilter.click();
    await expect(page.getByTestId('any-record-of-filter-modal')).toBeVisible();
    const variablesLocator = page.getByTestId('any-record-of-filter-modal').locator('div');
    await expect(variablesLocator).toHaveCount(mockDataWithChildren.children.length);
    await expect(variablesLocator.first()).toHaveText(mockDataWithChildren.children[0].conceptPath);
  });
  test('Clicking the close button closes the modal', async ({ page }) => {
    const addedFilter = page.getByTestId(/^any-record-of-filter-modal-.*-btn$/);
    await expect(addedFilter).toBeVisible();
    await addedFilter.click();
    const modal = page.getByTestId('any-record-of-filter-modal');
    await expect(modal).toBeVisible();
    await page
      .locator('#modal-component')
      .filter({ has: modal })
      .getByTestId('modal-close-button')
      .click();
    await expect(modal).not.toBeVisible();
  });
  test('If there is only Any Record of filter, the distributions button is hidden', async ({
    page,
  }) => {
    await expect(page.getByTestId('distributions-btn')).not.toBeVisible();
  });
});
test.describe('User with no query scopes can add filters without error', () => {
  // A continuous variable in a study this user has no scope for. Continuous, because the case
  // is that the add itself does not error, and a range with both bounds blank is addable.
  const outOfScopeVariable = mockData.content[7] as SearchResult;
  test.use({ storageState: 'tests/end-to-end/.auth/noScopeUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockConcepts(page, ALL_CONCEPTS);
    await mockApiSuccess(page, countResultPath, '9999');
  });

  test('User can prepare data for analysis', async ({ page }) => {
    // Given
    await openVariable(page, outOfScopeVariable);

    // When
    await filterParticipants(page).click();
    await page.locator('#export-data-button').click();

    // Then
    await expect(page.locator('#discover-error-container')).not.toBeVisible();
  });
  test('User can view variable distirubtions', async ({ page }) => {
    // Given
    await openVariable(page, outOfScopeVariable);

    // When
    await filterParticipants(page).click();
    await page.getByTestId('distributions-btn').click();

    // Then
    await expect(page.locator('#discover-error-container')).not.toBeVisible();
  });
});
test.describe('Query V3 OR features', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/noScopeUser.json' });
  let querySyncRequest: string[] = [];

  test.beforeEach(async ({ page }) => {
    page.on('request', (request) => {
      if (request.url().includes('/picsure/hpds/auth/v3/query/sync')) {
        const data = request.postData();
        if (data !== null) {
          querySyncRequest.push(data);
        }
      }
    });
    await mockConcepts(page, ALL_CONCEPTS);
  });

  test.afterEach(() => {
    querySyncRequest = [];
  });
  test('sends request with QueryV3 structure', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    await pickFirstValue(page);
    await filterParticipants(page).click();

    // Then - the summary panel's no-filter count on page load comes first, so assert on the
    // most recent request rather than pinning a total that counts it.
    await expect(page.getByTestId('results-panel-filter-count')).toHaveText(/^1 filter added$/);
    expect(querySyncRequest.at(-1)).toContain('phenotypicClauses');
  });
  test('shows AND label between filters on explorer', async ({ page }) => {
    // Given
    await mockApiSuccess(page, countResultPath, '9999');

    // When
    await openVariable(page, detailResForAge);
    await page.locator('#select-all').click();
    await filterParticipants(page).click();

    await openVariable(page, detailResForAge2);
    await page.locator('#select-all').click();
    await filterParticipants(page).click();

    // Then
    await expect(page.getByTestId('operator-label')).toHaveCount(1);
    await expect(page.getByTestId('operator-label').first()).toHaveText('AND');
  });
});

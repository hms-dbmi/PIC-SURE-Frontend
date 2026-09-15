import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  searchResults as mockData,
  searchResultPath,
  geneValues,
  geneValuesPage2,
} from '../mock-data';
import { getOption, optionsHaveLoaded, userIsLoggedIn } from '../utils';

const queryResultPath = '*/**/picsure/hpds/auth/v3/query/sync';

/*
 * `OptionsSelectionList` - the two-column value picker - as the variable detail page renders
 * it.
 *
 * These cases used to reach the list through the per-row Filter icon on the search results,
 * which ALS-12881 removes. The detail page's filter panel is where a user picks values now, so
 * that is where they are pointed; the list itself is the same component, which is also what
 * the cohort panel's edit modal and the genomic filter render.
 *
 * The detail page is addressed by URL. It carries the dataset and the concept path because
 * concept detail needs both.
 */
const detailUrl = (section: 'explorer' | 'discover', dataset: string, conceptPath: string) =>
  `/${section}/variable/${encodeURIComponent(dataset)}/${encodeURIComponent(conceptPath)}`;

/** Answers concept detail for whatever concept path is asked for. */
const mockConcept = (page: Page, json: unknown) =>
  page.route(`${conceptsDetailPath}/*`, (route: Route) => route.fulfill({ json }));

const list = (page: Page) => page.getByTestId('optional-selection-list');
const optionContainer = (page: Page) => list(page).locator('#options-container');
const selectedContainer = (page: Page) => list(page).locator('#selected-options-container');

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('OptionalSelectionList', () => {
  // TODO: Some feartures will be hidden in the future. Cannot use nth.

  /** Opens `concept`'s detail page on Discover, with its value list rendered. */
  async function openVariable(
    page: Page,
    concept: { dataset: string; conceptPath: string; values: string[] },
  ) {
    await mockConcept(page, concept);
    await page.goto(detailUrl('discover', concept.dataset, concept.conceptPath));
    await expect(page.getByTestId('variable-filter-panel')).toBeVisible();
    return concept;
  }

  test.beforeEach(async ({ page }) => {
    // DISCOVER is required because these tests open a Discover detail page; the (public)
    // layout guard redirects to /explorer when it is off.
    await mockApiConfig(page, { features: [{ name: 'DISCOVER', value: 'true' }] });
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
  });

  test('Renders', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // Then
    await optionsHaveLoaded(page);
  });

  test('Search Box shows', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When
    const searchBox = list(page).locator('input[type="search"]');

    // Then
    await expect(searchBox).toBeVisible();
  });

  test('Expected Options are shown and unchecked', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);
    const expectedValues = [...detailResponseCat.values];

    // Then
    await optionsHaveLoaded(page);
    const options = await optionContainer(page).getByRole('listitem').all();

    expect(options).toHaveLength(expectedValues.length);
    for (const option of options) {
      await expect(option).toBeVisible();
      await expect(option).not.toBeChecked();
      await expect(option).toHaveText(expectedValues.shift() || '');
    }
  });

  test('Selected options is empty', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // Then
    await optionsHaveLoaded(page);
    const options = await selectedContainer(page).getByRole('listitem').all();
    expect(options).toHaveLength(0);
  });

  test('Selected option moves to selected option', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);

    // When - select the first option
    const firstItem = await getOption(page);
    await firstItem.click();

    const selectedOptions = await selectedContainer(page).getByRole('listitem').all();
    const firstSelectedOption = selectedOptions[0];
    const checkbox = firstSelectedOption.locator('input');

    // Then
    await expect(firstSelectedOption).toBeVisible();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
    // And it is gone from the column it came from, rather than shown in both
    await expect(optionContainer(page).getByRole('listitem')).toHaveCount(
      detailResponseCat.values.length - 1,
    );
  });

  test('Clicking select all button selects all options', async ({ page }) => {
    // Given
    await openVariable(page, detailResponseCat);
    const dataValues = [...detailResponseCat.values];

    // When
    await optionsHaveLoaded(page);
    await list(page).locator('#select-all').click();

    const selectedOptions = await selectedContainer(page).getByRole('listitem').all();

    // Then
    await expect(selectedContainer(page)).toBeVisible();
    expect(selectedOptions).toHaveLength(dataValues.length);
    for (const option of selectedOptions) {
      await expect(option).toBeVisible();
      await expect(option).toBeChecked();
      await expect(option).toHaveText(dataValues.shift() || '');
    }
    await expect(optionContainer(page)).toBeEmpty();
  });

  test('Clicking select all button selects all options in the data', async ({ page }) => {
    // Given a variable with more values than the list pages in at once
    await openVariable(page, detailResponseCat2);
    const dataValues = [...detailResponseCat2.values];
    expect(dataValues.length).toBeGreaterThan(1);

    // When
    await optionsHaveLoaded(page);
    await list(page).locator('#select-all').click();

    // Then every value in the data is selected, not only the ones the column has room to
    // show - which is the claim in this test's name, and the one the assertions it replaces
    // could not make: a `for` over an empty list of locators passes vacuously, and the
    // `shift()` inside that loop emptied `dataValues` before the length comparison after it,
    // which was `expect(a === b)` with no matcher and so could not fail either.
    const displayed = selectedContainer(page).getByRole('listitem');
    await expect(displayed).toHaveCount(20);
    await selectedContainer(page).evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(displayed).toHaveCount(dataValues.length);
    expect((await displayed.allInnerTexts()).map((text) => text.trim())).toEqual(dataValues);
    await expect(optionContainer(page)).toBeEmpty();
  });

  /*
   * A value put back has to respect the search box.
   *
   * `onUnselect` and `clearSelectedOptions` prepended straight into the left-hand column
   * without consulting the term, so unticking a value the term excludes put it back into a
   * column that was supposed to be narrowed - under a search box still reading the term.
   * Pre-existing; visible on the detail page, where this list is now the whole interface.
   */
  test('does not put a value back into a column the search has narrowed', async ({ page }) => {
    // Given "No" picked, and the left-hand column narrowed to a term it does not match
    await openVariable(page, detailResponseCat);
    const searchBox = list(page).locator('input[type="search"]');

    await optionContainer(page).locator('input[value="No"]').click();
    await expect(selectedContainer(page).locator('input[value="No"]')).toHaveCount(1);
    await searchBox.fill('Yes');
    await expect(optionContainer(page).getByRole('listitem')).toHaveCount(1);

    // When it is unticked where it sits
    await selectedContainer(page).locator('input[value="No"]').click();

    // Then it is gone from both columns, rather than shown under a term that excludes it
    await expect(selectedContainer(page).getByRole('listitem')).toHaveCount(0);
    await expect(optionContainer(page).locator('input[value="No"]')).toHaveCount(0);
    await expect(optionContainer(page).getByRole('listitem')).toHaveCount(1);

    // And clearing the term brings it back, so nothing was lost
    await searchBox.fill('');
    await expect(optionContainer(page).locator('input[value="No"]')).toHaveCount(1);
    await expect(optionContainer(page).getByRole('listitem')).toHaveCount(3);
  });

  test('Loads next values when scrolling', async ({ page }) => {
    // Given
    const manyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await openVariable(page, manyOptions);

    // Then
    await optionsHaveLoaded(page);

    // Check initial load
    let visibleOptions = await optionContainer(page).getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(41);

    // Scroll to bottom
    await optionContainer(page).evaluate((node) => node.scrollTo(0, node.scrollHeight));

    // Wait for more options to load
    await page.waitForTimeout(1000); // Adjust timeout as needed

    // Check if more options have loaded
    visibleOptions = await optionContainer(page).getByRole('listitem').all();
    expect(visibleOptions.length).toBeGreaterThan(20); // Assuming initial page size is 20
    expect(visibleOptions.length).toBeLessThan(100); // Ensure not all options are loaded at once

    // Verify last visible option
    const lastVisibleOption = visibleOptions[visibleOptions.length - 1];
    await expect(lastVisibleOption).toBeVisible();
    await expect(lastVisibleOption).toHaveText(/Option \d+/);
  });

  test('Loads next selected values when scrolling', async ({ page }) => {
    // Given
    const manyOptions = {
      ...detailResponseCat2,
      values: Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`),
    };
    await openVariable(page, manyOptions);
    await optionsHaveLoaded(page);

    // When - select all options
    await list(page).locator('#select-all').click();

    // Then
    await optionsHaveLoaded(page, 'selected-options-container');

    // Check initial load of selected options
    let visibleSelectedOptions = await selectedContainer(page).getByRole('listitem').all();
    expect(visibleSelectedOptions.length).toBe(20); // Assuming initial page size is 20

    // Scroll to bottom of selected options
    await selectedContainer(page).evaluate((node) => node.scrollTo(0, node.scrollHeight));

    // Wait for more options to load
    await page.waitForTimeout(1000); // Adjust timeout as needed

    // Check if more selected options have loaded
    visibleSelectedOptions = await selectedContainer(page).getByRole('listitem').all();
    expect(visibleSelectedOptions.length).toBeGreaterThan(20);
    expect(visibleSelectedOptions.length).toBeLessThan(50); // Ensure not all loaded at once

    // Verify last visible selected option
    const lastVisibleSelectedOption = visibleSelectedOptions[visibleSelectedOptions.length - 1];
    await expect(lastVisibleSelectedOption).toBeVisible();
    await expect(lastVisibleSelectedOption).toHaveText(/Option \d+/);
  });
});

/*
 * Clear has no place in the designed panel - `p1-04` puts Filter Participants in the corner
 * Clear used to occupy, and a value comes back by unticking it where it sits, which
 * `explorer/variable-detail` covers.
 *
 * So this case stays pointed at the surface that still offers Clear: the cohort panel's edit
 * modal. Moving it to the detail page would have meant deleting it, and Clear would then have
 * had no coverage anywhere.
 */
test.describe('Clear, in the filter edit modal', () => {
  const getId = (option: string) => option.replaceAll(' ', '-').toLowerCase();

  test('Clicking clears removes selected and repopulates the options', async ({ page }) => {
    // Given a filter on this variable, added from its detail page
    await mockApiConfig(page);
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(queryResultPath, async (route: Route) => route.fulfill({ body: '9999' }));
    await mockConcept(page, detailResponseCat);

    await page.goto(
      detailUrl('explorer', detailResponseCat.dataset, detailResponseCat.conceptPath),
    );
    await userIsLoggedIn(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    await page.getByTestId('filter-participants').click();

    // When the filter is opened for editing, where the list still offers Clear
    const chip = page.getByTestId(`added-filter-${detailResponseCat.conceptPath}`);
    await chip.getByRole('button', { name: 'Edit Filter' }).click();
    const modal = page.getByRole('dialog');
    const component = modal.getByTestId('optional-selection-list');
    const option = '#option-' + getId(detailResponseCat.values[0]);

    await expect(component.locator('#selected-options-container').locator(option)).toBeVisible();
    await expect(component.locator('#options-container').locator(option)).toHaveCount(0);
    await component.locator('#clear').click();

    // Then
    await expect(component.locator('#selected-options-container')).toBeEmpty();
    await expect(component.locator('#options-container').locator(option)).toBeVisible();
  });
});

/*
 * The infinite-scroll branch of the same list, which pages from the API rather than from a
 * concept's `values`. Only the genomic filter uses it, so it stays where it is.
 */
test.describe('OptionalSelectionList, paging from the API', () => {
  test('Loads next values when scrolling when infinite scroll is enabled', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
      ],
    });
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
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
    await page.getByTestId('genomic-filter-btn').click();
    await expect(page.getByTestId('gene-variant-option')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('gene-variant-option').click();

    // Then
    await optionsHaveLoaded(page);

    // Check initial load
    let visibleOptions = await optionContainer(page).getByRole('listitem').all();
    expect(visibleOptions.length).toBeLessThan(21);

    await mockApiSuccess(
      page,
      `*/**/picsure/hpds/auth/search/values?genomicConceptPath=Gene_with_variant&query=&page=2&size=20`,
      {
        ...geneValuesPage2,
      },
    );

    // Scroll to bottom
    await optionContainer(page).evaluate((node) => node.scrollTo(0, node.scrollHeight + 30));

    // Wait for more options to load
    await page.waitForTimeout(1000); // Adjust timeout as needed

    // Check if more options have loaded
    visibleOptions = await optionContainer(page).getByRole('listitem').all();
    expect(visibleOptions.length).toBeGreaterThan(20); // Assuming initial page size is 20
    expect(visibleOptions.length).toBeLessThan(100); // Ensure not all options are loaded at once

    // Verify last visible option
    const lastVisibleOption = visibleOptions[visibleOptions.length - 1];
    await expect(lastVisibleOption).toBeVisible();
  });
});

import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { facetResultPath, facetsResponse, searchResults } from './mock-data';

// This method is used to ensure that the user state is fully loaded before proceeding.
// Sometimes, the tests are flaky because there is a race condition in the tests that
// causes the user to not be fully logged in before some test steps.
export const userIsLoggedIn = async (page: Page) => {
  await expect(page.locator('#user-session-avatar').getByTestId('user-info-btn')).toBeVisible();
};

export const userIsLoggedOut = async (page: Page) => {
  await expect(page.locator('#user-session-avatar').locator('#user-login-btn')).toBeVisible();
};

export const optionsHaveLoaded = async (page: Page | Locator, container = 'options-container') => {
  await page
    .getByTestId('optional-selection-list')
    .first()
    .locator(`#${container} label`)
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });
};

export const getOption = async (page: Page | Locator, optionIndex = 0) => {
  // Use .first() to avoid strict-mode violations when multiple filter panels are briefly open
  const component = page.getByTestId('optional-selection-list').first();
  const optionContainer = component.locator('#options-container');
  await expect(optionContainer).toBeVisible({ timeout: 15000 });
  await optionsHaveLoaded(page);
  // Wait for at least one option to render before returning
  await optionContainer.getByRole('listitem').first().waitFor({ state: 'visible', timeout: 15000 });
  const options = await optionContainer.getByRole('listitem').all();
  return options[optionIndex];
};

export const nthFilterIcon = async (page: Page, rowIndex = 0) => {
  await expect(page.locator('tbody')).toBeVisible();
  const tableBody = page.locator('tbody');
  const firstRow = tableBody.locator('tr').nth(rowIndex);
  return firstRow.locator('td').last().locator('button').nth(1);
};

export const clickNthFilterIcon = async (page: Page, rowIndex = 0) => {
  const filterIcon = await nthFilterIcon(page, rowIndex);
  await expect(filterIcon).toBeVisible();
  await filterIcon.click();
};

// Only client-side navigation keeps a layout - and so the cohort summary panel it renders -
// alive, and page.goto() would not. The in-app links to Explore's child routes mostly live in
// that panel's body, which is the state under test in several specs, so a synthetic anchor
// exercises the same SvelteKit navigation without depending on the panel's own markup.
export const navigateInApp = async (page: Page, href: string) => {
  await page.evaluate((target) => {
    document.getElementById('e2e-nav-link')?.remove();
    const link = document.createElement('a');
    link.id = 'e2e-nav-link';
    link.href = target;
    link.textContent = 'e2e navigate';
    document.body.appendChild(link);
  }, href);
  await page.locator('#e2e-nav-link').click();
  // The click starts a client-side navigation that discards this anchor with the rest of the
  // old page, but a same-route navigation keeps the body - so remove it rather than leave a
  // stray visible link behind for the next assertion to trip over.
  await page.evaluate(() => document.getElementById('e2e-nav-link')?.remove());
};

/* --- Explore search-state harness ---------------------------------------------------------
 *
 * The search session belongs to the /explorer and /discover layouts, not to the results
 * page, so it outlives navigation within the section. The specs that guard that assert by
 * request count: the state assertions alone still pass if something silently refetches it
 * all back.
 */

/** Past the TableHandler's 250ms debounce, with room for a request to land after it. */
export const SEARCH_SETTLE_MS = 1000;

/** The first facet in facetsResponse, used to select one and check it survived. */
export const SEARCH_FACET_ID = 'phs000284';

// A RegExp, not mock-data's searchResultPath, because that one pins page_number=0 and these
// specs paginate. Matching on the query string keeps /concepts/detail out of the count.
const conceptSearchUrl = /\/picsure\/dictionary\/concepts\?/;

export const searchResultRows = (page: Page) =>
  page.locator('#ExplorerTable-table tbody tr[id^="ExplorerTable-row-"]');

export const searchCurrentPageButton = (page: Page) =>
  page.locator('.pagination button[aria-current="page"]');

export const searchFacetCheckbox = (page: Page) =>
  page.getByTestId('accordion-item').first().locator(`input[id="${SEARCH_FACET_ID}"]`);

/** The cohort summary strip above the search. */
export const cohortPanel = (page: Page) => page.locator('#results-panel-toggle');

export const searchFor = async (page: Page, term: string) => {
  await page.getByTestId('search-box').fill(term);
  await page.locator('#search-button').click();
};

/**
 * Serves a three-row, three-page search and counts the concept and facet requests behind it.
 * `concepts.terms` records what each concept request asked for.
 */
export const mockCountedSearch = async (page: Page) => {
  const concepts = { count: 0, terms: [] as string[] };
  const facets = { count: 0 };

  await page.route(conceptSearchUrl, async (route: Route) => {
    concepts.count += 1;
    concepts.terms.push(route.request().postDataJSON()?.search ?? '');
    const pageNumber = Number(new URL(route.request().url()).searchParams.get('page_number') ?? 0);
    await route.fulfill({
      json: {
        ...searchResults,
        totalElements: 25,
        totalPages: 3,
        numberOfElements: 3,
        pageable: { ...searchResults.pageable, pageNumber },
        content: searchResults.content.slice(0, 3),
      },
    });
  });
  await page.route(facetResultPath, async (route: Route) => {
    facets.count += 1;
    await route.fulfill({ json: facetsResponse });
  });

  return { concepts, facets };
};

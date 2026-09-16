import { expect, type Page, type Locator, type Route } from '@playwright/test';

import type { SearchResult } from '../../src/lib/models/Search';

import {
  conceptsDetailPath,
  facetResultPath,
  facetsResponse,
  genomicFilter,
  searchResults,
} from './mock-data';

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
    // 15s, matching the rest of getOption. The option list arrives from the filter
    // interface's own concept fetch, and that interface is now a page navigation away rather
    // than a panel opening in place - 5s went flaky under four parallel workers. A timeout,
    // not an assertion: what the specs check about the options is unchanged.
    .waitFor({ state: 'visible', timeout: 15000 });
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

/* --- Opening a search result ---------------------------------------------------------------
 *
 * A result is a card whose whole body is a link to the variable's detail page, and the four
 * actions that used to sit on the row - Info, Filter, Hierarchy, Add for Analysis - live on
 * that page now. So a spec that wants any of them opens the result first. These helpers are
 * the one place that knows how, since every spec below used to reach for a row icon.
 */

/** The result cards, in the order the server served them. */
export const searchResultCards = (page: Page) => page.getByTestId('search-result-card');

/** The variable detail page, whichever section it is in. */
export const variableDetail = (page: Page) => page.getByTestId('variable-detail');

/** Back to the results the detail page was opened from. */
export const backToResults = async (page: Page) => {
  await page.getByTestId('variable-detail-back').click();
  await expect(page.getByTestId('search-results')).toBeVisible();
};

/** Opens the nth result's detail page by clicking its card. */
export const openNthResult = async (page: Page, index = 0) => {
  // Returning first, so a spec can work through several results in a row the way it used to
  // with the row icons. A detail page is only ever reached from the list here.
  if (await variableDetail(page).isVisible()) await backToResults(page);
  const card = searchResultCards(page).nth(index);
  await expect(card).toBeVisible();
  await card.click();
  await expect(variableDetail(page)).toBeVisible();
};

/**
 * Opens the nth result's filter interface, which is on the variable's detail page.
 *
 * Waits for the panel rather than the section around it: `variable-detail-filter` also
 * renders for a variable that may not be filtered - carrying an explanation instead of an
 * interface - so waiting on the section alone would let a spec go on to assert nothing.
 *
 * The panel is `variable-filter-panel`, not `AddFilter`'s `filter-component`: ticket 14
 * replaced the filter this page was given in ticket 10 with the designed one, and
 * `filter-component` now appears nowhere on this page. Waiting on it would have waited out
 * the timeout, and asserting its absence would have passed for any UI at all.
 */
export const openNthResultFilter = async (page: Page, index = 0) => {
  await openNthResult(page, index);
  await expect(page.getByTestId('variable-filter-panel')).toBeVisible();
};

/**
 * The action of the detail page's filter interface - Filter Participants, in the design.
 *
 * The two add buttons this page used to carry both read `add-filter`, so the locator had to
 * be scoped to tell the filter interface's from the data hierarchy's. They no longer share a
 * test id: ticket 13 named the hierarchy's `add-hierarchy-filter`, and ticket 14's panel
 * carries `filter-participants`. One element each, which `variable-detail` pins.
 */
export const addFilterButton = (page: Page) => page.getByTestId('filter-participants');

/** The add button of the detail page's data hierarchy, for anyRecordOf selections. */
export const addHierarchyFilterButton = (page: Page) => page.getByTestId('add-hierarchy-filter');

/**
 * The rows as this module was loaded with them.
 *
 * Snapshotted rather than read live. Several specs mutate these fixtures in place -
 * `values.shift()` in optional-selection-list drains the array it walks - and a worker keeps
 * one copy of the module across every file it runs. Reading the live object opened a later
 * spec's filter interface with no options to select, once in a few runs, depending on which
 * file the worker had picked up first.
 */
const SEARCH_ROWS: SearchResult[] = structuredClone(searchResults.content) as SearchResult[];

/**
 * Serves concept detail for any concept in `searchResults`, out of the row itself.
 *
 * The detail page loads the concept before it renders anything, so every spec that opens a
 * result needs detail for it - where a row's filter icon only fetched it for a Categorical
 * variable's value list. A search row is a subset of a detail response, which is all a spec
 * needs to get the interface on screen. Specs that assert on detail fields register their own
 * route after this one and win.
 */
export const mockConceptDetailFromRows = (page: Page) =>
  page.route(`${conceptsDetailPath}/*`, async (route: Route) => {
    const conceptPath = route.request().postData() ?? '';
    const row = SEARCH_ROWS.find((result) => result.conceptPath === conceptPath);
    // An empty object is the dictionary saying it holds nothing for this key, which the page
    // renders as "we could not find that variable" - a visible failure, not a silent pass.
    await route.fulfill({ json: row ?? {} });
  });

/**
 * Serves concept detail for the concept paths named, keyed on the **request body**, and
 * defers anything else to the route registered before it.
 *
 * The usual override - `mockApiSuccess(page, `${conceptsDetailPath}/${dataset}`, detail)` -
 * is keyed on the URL, and the URL carries only the dataset: `concepts/detail/{dataset}`,
 * with the concept path in the body. So one of those answers for *every* concept in that
 * dataset, which has twice been diagnosed as something else on this branch - a spec opened
 * one row and was served a different row's detail. Use this instead wherever two concepts in
 * the same dataset have to give different answers, such as a parent and the related variable
 * under it.
 *
 * Unlisted paths fall through rather than 404, so `mockConceptDetailFromRows` still covers
 * every other concept the page asks for.
 */
export const mockConceptDetailByPath = (page: Page, byConceptPath: Record<string, unknown>) =>
  page.route(`${conceptsDetailPath}/*`, async (route: Route) => {
    const conceptPath = route.request().postData() ?? '';
    const detail = byConceptPath[conceptPath];
    if (detail === undefined) {
      await route.fallback();
      return;
    }
    await route.fulfill({ json: detail });
  });

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

// Puts a genomic filter in sessionStorage for the next page load to restore, the way a user
// who built one on an earlier visit would have left it. Must be called before navigating.
export const seedGenomicFilter = async (page: Page) => {
  await page.addInitScript(
    (json: string) => {
      sessionStorage.setItem('genomicFilters', json);
    },
    JSON.stringify([genomicFilter]),
  );
};

/* --- Explore search-state harness ---------------------------------------------------------
 *
 * The search session belongs to the /explorer and /discover layouts, not to the results
 * page, so it outlives navigation within the section. The specs that guard that assert by
 * request count: the state assertions alone still pass if something silently refetches it
 * all back. Shared by explorer/search-state and explorer/search-modes.
 */

/** Past the TableHandler's 250ms debounce, with room for a request to land after it. */
export const SEARCH_SETTLE_MS = 1000;

/** The first facet in facetsResponse, used to select one and check it survived. */
export const SEARCH_FACET_ID = 'phs000284';

// A RegExp, not mock-data's searchResultPath, because that one pins page_number=0 and these
// specs paginate. Matching on the query string keeps /concepts/detail out of the count.
const conceptSearchUrl = /\/picsure\/dictionary\/concepts\?/;

export const searchCurrentPageButton = (page: Page) =>
  page.locator('.pagination button[aria-current="page"]');

export const searchFacetCheckbox = (page: Page) =>
  page.getByTestId('accordion-item').first().locator(`input[id="${SEARCH_FACET_ID}"]`);

/**
 * The cohort panel, wherever it currently lives.
 *
 * Today it is the collapsed strip in the right sidebar (`results/SidePanel.svelte`).
 * ALS-12835 moves it above the search-mode bar and deletes that component, so the selector
 * changes - which is why it is here rather than spelled out in each spec. **Update this one
 * locator when the panel moves** and every spec that asserts the panel renders follows;
 * `explorer/variable-detail` depends on it for an acceptance criterion.
 */
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

import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiConfig } from '../../custom-context';
import { searchResults, facetsResponse, searchResultPath, facetResultPath } from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

const SLOW_MS = 3000;
const SETTLE_MS = SLOW_MS + 1500;

const PAST_DEBOUNCE_MS = 600;

// branding.explorePage.columns is empty in the test config, so no cell text
// renders - responses are told apart by row count and total.
const SUPERSEDED_ROWS = 3;
const SUPERSEDED_TOTAL = 99;
const CURRENT_ROWS = 1;
const CURRENT_TOTAL = 1;

function resultsWith(rowCount: number, totalElements: number) {
  return {
    ...searchResults,
    totalElements,
    numberOfElements: rowCount,
    content: Array.from({ length: rowCount }, (_, i) => ({
      ...searchResults.content[i % searchResults.content.length],
    })),
  };
}

const supersededResults = () => resultsWith(SUPERSEDED_ROWS, SUPERSEDED_TOTAL);
const currentResults = () => resultsWith(CURRENT_ROWS, CURRENT_TOTAL);

function resultRows(page: Page) {
  return page.locator('#ExplorerTable-table tbody tr[id^="row-"]');
}

// Cancellation surfaces only as a requestfailed event. Assert the count, not the
// message: Chromium says net::ERR_ABORTED, Firefox NS_BINDING_ABORTED.
function trackAborted(page: Page, urlPart: string): string[] {
  const aborted: string[] = [];
  page.on('requestfailed', (request) => {
    if (request.url().includes(urlPart)) {
      aborted.push(request.failure()?.errorText ?? 'unknown');
    }
  });
  return aborted;
}

async function fulfillIgnoringAbort(route: Route, json: unknown) {
  try {
    await route.fulfill({ json });
  } catch {
    // The request went away while the handler was sleeping; nothing to deliver.
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function routeSupersededThenCurrent(page: Page) {
  let call = 0;
  await page.route(searchResultPath, async (route: Route) => {
    call += 1;
    if (call === 1) {
      await delay(SLOW_MS);
      await fulfillIgnoringAbort(route, supersededResults());
      return;
    }
    await fulfillIgnoringAbort(route, currentResults());
  });
  await page.route(facetResultPath, async (route: Route) =>
    fulfillIgnoringAbort(route, facetsResponse),
  );
}

async function searchFor(page: Page, term: string) {
  await page.getByTestId('search-box').fill(term);
  await page.locator('#search-button').click();
}

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test.describe('Out-of-order search responses', () => {
  test.beforeEach(({ page }) => mockApiConfig(page));

  test('a slow first search cannot overwrite the results of a faster second one', async ({
    page,
  }) => {
    // Given
    const abortedSearches = trackAborted(page, 'concepts');
    await routeSupersededThenCurrent(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await searchFor(page, 'age');
    await page.waitForTimeout(PAST_DEBOUNCE_MS);
    await searchFor(page, 'bmi');

    // Then
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);

    await page.waitForTimeout(SETTLE_MS);
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
    expect(abortedSearches.length).toBeGreaterThan(0);
  });

  test('a superseded response cannot poison the row count', async ({ page }) => {
    // Given
    await routeSupersededThenCurrent(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await searchFor(page, 'age');
    await page.waitForTimeout(PAST_DEBOUNCE_MS);
    await searchFor(page, 'bmi');
    await page.waitForTimeout(SETTLE_MS);

    // Then - the superseded totalElements would add phantom pages to the pager
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
    await expect(page.locator('#search-results-col')).toContainText(`/ ${CURRENT_TOTAL}`);
    await expect(page.locator('#search-results-col')).not.toContainText(`${SUPERSEDED_TOTAL}`);
  });

  test('a slow search cannot overwrite results the user narrowed with a facet', async ({
    page,
  }) => {
    // Given
    const abortedSearches = trackAborted(page, 'concepts');
    await routeSupersededThenCurrent(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When - search, then narrow with a facet before the search comes back
    const facetCheckbox = page.locator(`input#${facetsResponse[0].facets[0].name}`);
    await expect(facetCheckbox).toBeVisible();
    await searchFor(page, 'age');
    await page.waitForTimeout(PAST_DEBOUNCE_MS);
    await facetCheckbox.click();

    // Then
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
    await page.waitForTimeout(SETTLE_MS);
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
    expect(abortedSearches.length).toBeGreaterThan(0);
  });

  test('a superseded response settling first does not clear the spinner', async ({ page }) => {
    // Given - the first request lands early, the second is still in flight
    let call = 0;
    await page.route(searchResultPath, async (route: Route) => {
      call += 1;
      const isFirst = call === 1;
      await delay(isFirst ? 800 : SLOW_MS);
      await fulfillIgnoringAbort(route, isFirst ? supersededResults() : currentResults());
    });
    await page.route(facetResultPath, async (route: Route) =>
      fulfillIgnoringAbort(route, facetsResponse),
    );
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await searchFor(page, 'age');
    await page.waitForTimeout(PAST_DEBOUNCE_MS);
    await searchFor(page, 'bmi');

    // Then - the superseded request has landed by now, but the current one has not
    const spinner = page.locator('#search-results-col').getByRole('progressbar');
    await page.waitForTimeout(1500);
    await expect(spinner).toBeVisible();
    await expect(resultRows(page)).toHaveCount(0);

    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS, { timeout: SETTLE_MS });
    await expect(spinner).toHaveCount(0);
  });
});

test.describe('Facet requests are independent of pagination', () => {
  test.beforeEach(({ page }) => mockApiConfig(page));

  test('paginating while facets are in flight does not cancel them', async ({ page }) => {
    // Given - concepts fast on every page, the search's facets slow.
    // searchResultPath pins page_number=0, so page 2 needs its own route.
    const pagedResults = { ...searchResults, totalElements: 50 };
    await page.route(searchResultPath, async (route: Route) =>
      fulfillIgnoringAbort(route, pagedResults),
    );
    const pageTwoPath = searchResultPath.replace('page_number=0', 'page_number=1');
    let pageTwoRequested = false;
    await page.route(pageTwoPath, async (route: Route) => {
      pageTwoRequested = true;
      await fulfillIgnoringAbort(route, pagedResults);
    });

    // Unique to the delayed response, so the assertion cannot pass on the
    // facets already rendered by the initial load.
    const delayedFacets = [
      { ...facetsResponse[0], name: 'delayed_category', display: 'Delayed Category' },
    ];

    const abortedFacets = trackAborted(page, 'facets');
    // Keyed on body, not call order: the mount's load and the search coalesce.
    await page.route(facetResultPath, async (route: Route) => {
      if (route.request().postDataJSON()?.search === 'age') {
        await delay(SLOW_MS);
        await fulfillIgnoringAbort(route, delayedFacets);
        return;
      }
      await fulfillIgnoringAbort(route, facetsResponse);
    });

    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When - search, then paginate before the facet response arrives
    await searchFor(page, 'age');
    const nextPage = page.getByLabel('Next', { exact: true });
    await expect(nextPage).toBeVisible({ timeout: SETTLE_MS });
    await page.waitForTimeout(PAST_DEBOUNCE_MS);
    await nextPage.click();

    // Then - pagination is not a criteria change
    await expect(page.getByText('Delayed Category')).toBeVisible({ timeout: SETTLE_MS });
    expect(pageTwoRequested).toBe(true);
    expect(abortedFacets).toEqual([]);
  });
});

test.describe('Leaving the page cancels in-flight searches', () => {
  // DISCOVER gates the nav link that makes this a client-side navigation.
  test.beforeEach(({ page }) =>
    mockApiConfig(page, { features: [{ name: 'DISCOVER', value: 'true' }] }),
  );

  test('a search started on /explorer does not land on /discover', async ({ page }) => {
    // Given
    const abortedSearches = trackAborted(page, 'concepts');
    await routeSupersededThenCurrent(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When - the in-app link, not page.goto(): a full document navigation would
    // cancel the request by itself and the test would pass with teardown deleted.
    await searchFor(page, 'age');
    await page.waitForTimeout(PAST_DEBOUNCE_MS);
    await page.locator('#nav-link-discover').click();
    await expect(page).toHaveURL(/\/discover/);

    // /discover re-runs the search itself (Explorer preserves $searchTerm), so
    // the check is that the superseded payload never renders.
    await page.waitForTimeout(SETTLE_MS);
    expect(abortedSearches.length).toBeGreaterThan(0);
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
    await expect(resultRows(page)).not.toHaveCount(SUPERSEDED_ROWS);
  });

  test('the incoming page still searches after the outgoing one is destroyed', async ({ page }) => {
    await page.route(searchResultPath, async (route: Route) =>
      fulfillIgnoringAbort(route, currentResults()),
    );
    await page.route(facetResultPath, async (route: Route) =>
      fulfillIgnoringAbort(route, facetsResponse),
    );
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await searchFor(page, 'age');
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);

    // When
    await page.locator('#nav-link-discover').click();
    await expect(page).toHaveURL(/\/discover/);
    await searchFor(page, 'bmi');

    // Then
    await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
  });
});

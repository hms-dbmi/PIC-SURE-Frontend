import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import {
  searchResults,
  facetsResponse,
  searchResultPath,
  facetResultPath,
} from '../../support/mock-data';
import { userIsLoggedIn } from '../utils';

// The ordering rules themselves (superseded responses, spinner, totals, facets vs
// pagination, teardown) are covered in src/lib/explorer/Search.test.ts. These check that the real
// page wires them up: a newer search wins, leaving the page cancels its search, and the
// outgoing page's teardown leaves the incoming page's search alone.

// branding.explorePage.columns is empty in the test config, so no cell text
// renders - responses are told apart by row count.
const SUPERSEDED_ROWS = 3;
const CURRENT_ROWS = 1;

function resultsWith(rowCount: number) {
  return {
    ...searchResults,
    totalElements: rowCount,
    numberOfElements: rowCount,
    content: Array.from({ length: rowCount }, (_, i) => ({
      ...searchResults.content[i % searchResults.content.length],
    })),
  };
}

function resultRows(page: Page) {
  return page.locator('#explorer-table tbody tr[id^="explorer-table-row-"]');
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
    // The request went away while it was held; nothing to deliver.
  }
}

// Holds the first search for `term` until release(), answering everything else at once.
// `requested` resolves when the held request arrives; `settled` once it has been answered.
async function holdFirstSearchFor(page: Page, term: string) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  let markRequested!: () => void;
  const requested = new Promise<void>((resolve) => (markRequested = resolve));
  let markSettled!: () => void;
  const settled = new Promise<void>((resolve) => (markSettled = resolve));
  let held = false;

  await page.route(searchResultPath, async (route: Route) => {
    if (!held && route.request().postDataJSON()?.search === term) {
      held = true;
      markRequested();
      await released;
      await fulfillIgnoringAbort(route, resultsWith(SUPERSEDED_ROWS));
      markSettled();
      return;
    }
    await fulfillIgnoringAbort(route, resultsWith(CURRENT_ROWS));
  });
  await page.route(facetResultPath, async (route: Route) =>
    fulfillIgnoringAbort(route, facetsResponse),
  );
  return { requested, release, settled };
}

async function searchFor(page: Page, term: string) {
  await page.getByTestId('ui-search-input').fill(term);
  await page.locator('#explorer-search-submit').click();
}

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

test('a slow first search cannot overwrite the results of a newer one', async ({ page }) => {
  // Given
  await mockApiConfig(page);
  const abortedSearches = trackAborted(page, 'concepts');
  const slowSearch = await holdFirstSearchFor(page, 'age');
  await page.goto('/explorer');
  await userIsLoggedIn(page);

  // When
  await searchFor(page, 'age');
  await slowSearch.requested;
  await searchFor(page, 'bmi');
  await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
  slowSearch.release();
  await slowSearch.settled;

  // Then
  await expect.poll(() => abortedSearches.length).toBeGreaterThan(0);
  await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
});

test('a search started on /explorer does not land on /discover', async ({ page }) => {
  // Given - DISCOVER gates the nav link that makes this a client-side navigation.
  await mockApiConfig(page, { features: [{ name: 'DISCOVER', value: 'true' }] });
  const abortedSearches = trackAborted(page, 'concepts');
  const slowSearch = await holdFirstSearchFor(page, 'age');
  await page.goto('/explorer');
  await userIsLoggedIn(page);

  // When - the in-app link, not page.goto(): a full document navigation would
  // cancel the request by itself and the test would pass with teardown deleted.
  await searchFor(page, 'age');
  await slowSearch.requested;
  await page.locator('#app-nav-link-discover').click();
  await expect(page).toHaveURL(/\/discover/);
  // /discover re-runs the search itself (Explorer preserves $searchTerm)
  await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
  slowSearch.release();
  await slowSearch.settled;

  // Then - the superseded payload never renders
  await expect.poll(() => abortedSearches.length).toBeGreaterThan(0);
  await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);
});

test('the incoming page still searches after the outgoing one is destroyed', async ({ page }) => {
  // Given
  await mockApiConfig(page, { features: [{ name: 'DISCOVER', value: 'true' }] });
  await page.route(searchResultPath, async (route: Route) =>
    fulfillIgnoringAbort(
      route,
      resultsWith(route.request().postDataJSON()?.search === 'bmi' ? 2 : CURRENT_ROWS),
    ),
  );
  await page.route(facetResultPath, async (route: Route) =>
    fulfillIgnoringAbort(route, facetsResponse),
  );
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await searchFor(page, 'age');
  await expect(resultRows(page)).toHaveCount(CURRENT_ROWS);

  // When
  await page.locator('#app-nav-link-discover').click();
  await expect(page).toHaveURL(/\/discover/);
  await searchFor(page, 'bmi');

  // Then
  await expect(resultRows(page)).toHaveCount(2);
});

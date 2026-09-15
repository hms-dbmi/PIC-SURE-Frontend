import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiConfig } from '../../custom-context';
import { facetResultPath, facetsResponse, searchResults } from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

// The search session belongs to /explorer/+layout.svelte and /discover/+layout.svelte, not to
// Explorer.svelte, so it outlives the results page. These specs guard that by counting
// requests: a round trip through a child route must not re-issue the concept or facet search.
// The count assertion is the point - the state assertions alone still pass if something
// silently refetches it all back.

// A RegExp, not mock-data's searchResultPath, because that one pins page_number=0 and these
// specs paginate. Matching on the query string keeps /concepts/detail out of the count.
const conceptSearchUrl = /\/picsure\/dictionary\/concepts\?/;

// Past the TableHandler's 250ms debounce, with room for a request to land after it.
const SETTLE_MS = 1000;

const FACET_ID = 'phs000284';

const childRoutes = [
  { path: '/explorer/distributions', settles: true },
  { path: '/explorer/advanced-filtering', settles: true },
  { path: '/explorer/export', settles: true },
  // Bounces straight back to /explorer without a genomic filter. Still a real navigation out
  // of and back into the results page, which is what is being guarded here.
  { path: '/explorer/variant', settles: false },
];

function resultRows(page: Page) {
  return page.locator('#ExplorerTable-table tbody tr[id^="ExplorerTable-row-"]');
}

function currentPageButton(page: Page) {
  return page.locator('.pagination button[aria-current="page"]');
}

function facetCheckbox(page: Page) {
  return page.getByTestId('accordion-item').first().locator(`input[id="${FACET_ID}"]`);
}

async function mockCountedSearch(page: Page) {
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
}

// Only client-side navigation keeps the layout alive, and page.goto() would not. The in-app
// links to these child routes all live in the results panel and need filter state built first
// - state ALS-12835 is about to rewrite - so a synthetic in-app anchor exercises the same
// SvelteKit navigation without tying this spec to that markup.
async function navigateInApp(page: Page, href: string) {
  await page.evaluate((target) => {
    document.getElementById('e2e-nav-link')?.remove();
    const link = document.createElement('a');
    link.id = 'e2e-nav-link';
    link.href = target;
    link.textContent = 'e2e navigate';
    document.body.appendChild(link);
  }, href);
  await page.locator('#e2e-nav-link').click();
}

async function searchFor(page: Page, term: string) {
  await page.getByTestId('search-box').fill(term);
  await page.locator('#search-button').click();
}

test.describe('Explore search state survives leaving the results page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(({ page }) =>
    mockApiConfig(page, { features: [{ name: 'ALLOW_EXPORT_ENABLED', value: 'true' }] }),
  );

  for (const { path, settles } of childRoutes) {
    test(`returning from ${path} restores the search without refetching`, async ({ page }) => {
      // Given a search, a selected facet and a non-default page
      const { concepts, facets } = await mockCountedSearch(page);
      await page.goto('/explorer');
      await userIsLoggedIn(page);
      await searchFor(page, 'age');
      await expect(resultRows(page)).toHaveCount(3);

      await expect(facetCheckbox(page)).toBeVisible();
      await facetCheckbox(page).click();
      await expect(facetCheckbox(page)).toBeChecked();

      await page.locator('.pagination button[aria-label="Page 2"]').click();
      await expect(currentPageButton(page)).toHaveText('2');
      await page.waitForTimeout(SETTLE_MS);

      const conceptsBefore = concepts.count;
      const facetsBefore = facets.count;

      // When the user leaves for a child route and comes back
      await navigateInApp(page, path);
      if (settles) {
        await expect(page).toHaveURL(new RegExp(`${path}$`));
      }
      await navigateInApp(page, '/explorer');
      await expect(page).toHaveURL(/\/explorer$/);

      // Then everything is as they left it, and nothing was fetched again
      await expect(page.getByTestId('search-box')).toHaveValue('age');
      await expect(resultRows(page)).toHaveCount(3);
      await expect(currentPageButton(page)).toHaveText('2');
      await expect(facetCheckbox(page)).toBeChecked();

      await page.waitForTimeout(SETTLE_MS);
      expect(concepts.count).toBe(conceptsBefore);
      expect(facets.count).toBe(facetsBefore);
    });
  }

  test('a ?search= navigation from inside the layout drives the box and the results', async ({
    page,
  }) => {
    // Given a cleared search on /explorer
    const { concepts } = await mockCountedSearch(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await searchFor(page, 'age');
    await expect(resultRows(page)).toHaveCount(3);
    await page.getByRole('button', { name: 'You are on the reset button' }).click();
    await expect(resultRows(page)).toHaveCount(0);
    await page.waitForTimeout(SETTLE_MS);

    // When a ?search= navigation originates inside the layout - browser history, or the
    // variable detail page's Back button - rather than on a cold load
    await navigateInApp(page, '/explorer?search=asthma');
    await expect(page).toHaveURL(/\/explorer\?search=asthma$/);

    // Then the store moved too, so the box and the rows below it agree
    await expect(page.getByTestId('search-box')).toHaveValue('asthma');
    await expect(resultRows(page)).toHaveCount(3);
    expect(concepts.terms.at(-1)).toBe('asthma');
  });

  test('a ?search= navigation the store already agrees with does not refetch', async ({ page }) => {
    // Given a search, which leaves the URL at ?search=age
    const { concepts } = await mockCountedSearch(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await searchFor(page, 'age');
    await expect(resultRows(page)).toHaveCount(3);
    await page.waitForTimeout(SETTLE_MS);
    const conceptsBefore = concepts.count;

    // When the user round trips back to the same ?search= URL
    await navigateInApp(page, '/explorer/distributions');
    await expect(page).toHaveURL(/\/explorer\/distributions$/);
    await navigateInApp(page, '/explorer?search=age');
    await expect(page).toHaveURL(/\/explorer\?search=age$/);

    // Then the param matches the store and nothing re-searches
    await expect(page.getByTestId('search-box')).toHaveValue('age');
    await expect(resultRows(page)).toHaveCount(3);
    await page.waitForTimeout(SETTLE_MS);
    expect(concepts.count).toBe(conceptsBefore);
  });
});

// Discover runs the same session helper behind a second layout instance, and the two instances
// are the boundary that keeps open-access results off the authenticated page - so it needs its
// own coverage, not just Explore's.
test.describe('Discover search state survives leaving the results page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(({ page }) =>
    mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
      ],
    }),
  );

  for (const path of ['/discover/distributions', '/discover/advanced-filtering']) {
    test(`returning from ${path} restores the search without refetching`, async ({ page }) => {
      // Given a search on Discover
      const { concepts, facets } = await mockCountedSearch(page);
      await page.goto('/discover');
      await searchFor(page, 'age');
      await expect(resultRows(page)).toHaveCount(3);
      await page.waitForTimeout(SETTLE_MS);

      const conceptsBefore = concepts.count;
      const facetsBefore = facets.count;

      // When the user leaves for a child route and comes back
      await navigateInApp(page, path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await navigateInApp(page, '/discover');
      await expect(page).toHaveURL(/\/discover$/);

      // Then the search is still there, unfetched
      await expect(page.getByTestId('search-box')).toHaveValue('age');
      await expect(resultRows(page)).toHaveCount(3);

      await page.waitForTimeout(SETTLE_MS);
      expect(concepts.count).toBe(conceptsBefore);
      expect(facets.count).toBe(facetsBefore);
    });
  }
});

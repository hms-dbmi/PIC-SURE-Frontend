import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../../custom-context';
import { facetResultPath, facetsResponse, searchResultPath, searchResults } from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

// The search-mode bar. Switching modes must preserve the search, which only works because the
// session belongs to /explorer/+layout.svelte rather than to the results page - so the
// preservation spec asserts by request count, the way search-state/test.ts does. State
// assertions alone still pass if something silently refetches it all back.

const conceptSearchUrl = /\/picsure\/dictionary\/concepts\?/;

// Past the TableHandler's 250ms debounce, with room for a request to land after it.
const SETTLE_MS = 1000;

const FACET_ID = 'phs000284';

const genomicEnabled = { features: [{ name: 'ENABLE_GENE_QUERY', value: 'true' }] };

function resultRows(page: Page) {
  return page.locator('#ExplorerTable-table tbody tr[id^="ExplorerTable-row-"]');
}

function currentPageButton(page: Page) {
  return page.locator('.pagination button[aria-current="page"]');
}

function facetCheckbox(page: Page) {
  return page.getByTestId('accordion-item').first().locator(`input[id="${FACET_ID}"]`);
}

const tabBar = (page: Page) => page.getByTestId('search-mode-tabs');
const tab = (page: Page, id: string) => page.getByTestId(`search-mode-tab-${id}`);

async function mockCountedSearch(page: Page) {
  const concepts = { count: 0 };
  const facets = { count: 0 };

  await page.route(conceptSearchUrl, async (route: Route) => {
    concepts.count += 1;
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

async function searchFor(page: Page, term: string) {
  await page.getByTestId('search-box').fill(term);
  await page.locator('#search-button').click();
}

test.describe('Explore tab bar', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, genomicEnabled);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
  });

  test('shows Phenotypes and Genotypes, with Phenotypes on /explorer', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then - a navigation landmark of links, with the current one marked
    const bar = page.getByRole('navigation', { name: 'Search modes' });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link')).toHaveText(['Phenotypes', 'Genotypes']);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(tab(page, 'phenotypes')).toHaveAttribute('aria-current', 'page');
    await expect(tab(page, 'genotypes')).not.toHaveAttribute('aria-current');
  });

  // Anchors, not buttons, because the tabs are routes: this is what makes middle-click open
  // a new browser tab and right-click offer Copy Link, both of which are browser-native
  // given a real href that nothing calls preventDefault on.
  test('renders the tabs as links to their routes', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(tab(page, 'phenotypes')).toHaveAttribute('href', '/explorer');
    await expect(tab(page, 'genotypes')).toHaveAttribute('href', '/explorer/genotypes');
    expect(await tab(page, 'genotypes').evaluate((element) => element.tagName)).toBe('A');
  });

  test('middle-clicking a tab opens it in a new browser tab', async ({
    page,
    context,
    browserName,
  }) => {
    // WebKit under automation does not open a page on a middle-click, so there is no page
    // event to wait for there. The anchor itself is asserted on every engine above.
    test.skip(browserName === 'webkit', 'WebKit does not open a new page on middle-click');

    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    const opened = context.waitForEvent('page');
    await tab(page, 'genotypes').click({ button: 'middle' });

    // Then
    const newTab = await opened;
    // A freshly opened tab resolves from waitForEvent before it has committed a navigation, so
    // its URL can still be '' when toHaveURL starts its window. Under load that outlasted the
    // 5s assertion and then hit the test timeout - a flake in the assertion, not the feature.
    await newTab.waitForLoadState();
    await expect(newTab).toHaveURL(/\/explorer\/genotypes$/);
    await expect(page).toHaveURL(/\/explorer$/);
    await newTab.close();
  });

  test('reaches the Genotypes placeholder and marks it current', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await tab(page, 'genotypes').click();

    // Then
    await expect(page).toHaveURL(/\/explorer\/genotypes$/);
    await expect(page.getByTestId('genotypes-placeholder')).toBeVisible();
    await expect(tab(page, 'genotypes')).toHaveAttribute('aria-current', 'page');
    await expect(tab(page, 'phenotypes')).not.toHaveAttribute('aria-current');
  });

  test('keeps the tab bar on the routes the cohort panel renders on', async ({ page }) => {
    // Given
    await page.goto('/explorer/advanced-filtering');
    await userIsLoggedIn(page);

    // Then a sibling route keeps the bar, with no mode current
    await expect(tabBar(page)).toBeVisible();
    await expect(tab(page, 'phenotypes')).not.toHaveAttribute('aria-current');
    await expect(tab(page, 'genotypes')).not.toHaveAttribute('aria-current');

    // And the two full-page routes drop it, asserted only once each route has actually
    // rendered: toHaveCount(0) is satisfied by its first poll, so against a page still
    // navigating it would pass whatever the bar went on to do.
    await page.goto('/explorer/distributions');
    await expect(page).toHaveURL(/\/explorer\/distributions$/);
    await expect(page.getByRole('heading', { name: 'Variable Distributions' })).toBeVisible();
    await expect(tabBar(page)).toHaveCount(0);

    await page.goto('/explorer/export');
    await expect(page).toHaveURL(/\/explorer\/export$/);
    await expect(
      page.getByRole('heading', { name: 'Export Data for Research Analysis' }),
    ).toBeVisible();
    await expect(tabBar(page)).toHaveCount(0);
  });

  test('hides the tab bar when genomic search is off, leaving one mode', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'false' },
        { name: 'ENABLE_SNP_QUERY', value: 'false' },
      ],
    });

    // When
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('search-box')).toBeVisible();
    await expect(tabBar(page)).toHaveCount(0);
  });
});

test.describe('Explore tab switching', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(({ page }) => mockApiConfig(page, genomicEnabled));

  test('preserves the search term, facets, page and results with no refetch', async ({ page }) => {
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

    // When the user switches to Genotypes and back
    await tab(page, 'genotypes').click();
    await expect(page).toHaveURL(/\/explorer\/genotypes$/);
    await expect(page.getByTestId('genotypes-placeholder')).toBeVisible();
    await tab(page, 'phenotypes').click();
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
});

test.describe('Discover', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  // Genomic search on, to prove Discover's single mode is the isDiscover half of the rule
  // and not just an unset flag.
  test.beforeEach(({ page }) =>
    mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
      ],
    }),
  );

  test('shows no tab bar, having a single search mode', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);

    // When
    await page.goto('/discover');

    // Then
    await expect(page.getByTestId('search-box')).toBeVisible();
    await expect(tabBar(page)).toHaveCount(0);
  });
});

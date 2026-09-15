import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../../custom-context';
import { facetResultPath, facetsResponse, searchResultPath, searchResults } from '../../mock-data';
import {
  mockCountedSearch,
  searchCurrentPageButton as currentPageButton,
  searchFacetCheckbox as facetCheckbox,
  searchFor,
  searchResultCards as resultCards,
  SEARCH_SETTLE_MS as SETTLE_MS,
  userIsLoggedIn,
} from '../../utils';

// The search-mode bar. It is a navigation landmark of links, not a tab widget: the modes are
// routes, and there is no tabpanel for role="tab" to control. Switching modes must preserve
// the search, which only works because the session belongs to /explorer/+layout.svelte rather
// than to the results page - so that spec asserts by request count, using the harness in
// utils.ts that explorer/search-state shares.

const genomicEnabled = { features: [{ name: 'ENABLE_GENE_QUERY', value: 'true' }] };
const genomicDisabled = {
  features: [
    { name: 'ENABLE_GENE_QUERY', value: 'false' },
    { name: 'ENABLE_SNP_QUERY', value: 'false' },
  ],
};

const modeBar = (page: Page) => page.getByTestId('search-mode-tabs');
const modeLink = (page: Page, id: string) => page.getByTestId(`search-mode-tab-${id}`);
const activeLinks = (page: Page) => modeBar(page).locator('[aria-current="page"]');

test.describe('Explore search mode bar', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, genomicEnabled);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
  });

  test('is a named navigation landmark listing Phenotypes and Genotypes', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then it is a nav with an accessible name, which it needs because the main navigation
    // is another nav landmark on the same page
    await expect(modeBar(page)).toHaveRole('navigation');
    await expect(modeBar(page)).toHaveAttribute('aria-label', 'Search modes');
    await expect(page.getByRole('navigation', { name: 'Search modes' })).toBeVisible();
    await expect(modeBar(page).getByRole('link')).toHaveText(['Phenotypes', 'Genotypes']);
  });

  // Dropped with the tabs pattern: without a tabpanel these announced a widget the DOM did
  // not honour, and role="tab" hid the links' own role so AT could not predict a page change.
  test('carries no tab-widget semantics', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('[role="tablist"]')).toHaveCount(0);
    await expect(page.locator('[role="tab"]')).toHaveCount(0);
    await expect(modeBar(page).locator('[aria-selected]')).toHaveCount(0);
  });

  test('marks exactly the current route with aria-current', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(activeLinks(page)).toHaveCount(1);
    await expect(modeLink(page, 'phenotypes')).toHaveAttribute('aria-current', 'page');
    await expect(modeLink(page, 'genotypes')).not.toHaveAttribute('aria-current');
  });

  // Anchors, not buttons, because the modes are routes: this is what makes middle-click open
  // a new browser tab and right-click offer Copy Link, both of which are browser-native
  // given a real href that nothing calls preventDefault on.
  test('renders the modes as links to their routes', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(modeLink(page, 'phenotypes')).toHaveAttribute('href', '/explorer');
    await expect(modeLink(page, 'genotypes')).toHaveAttribute('href', '/explorer/genotypes');
    expect(await modeLink(page, 'genotypes').evaluate((element) => element.tagName)).toBe('A');
  });

  // Otherwise Copy Link on Phenotypes yields a link that discards the user's search, and the
  // address bar stops agreeing with the results on screen.
  test('carries the active search in both hrefs', async ({ page }) => {
    // Given a search
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await searchFor(page, 'age');
    await expect(page).toHaveURL(/\?search=age$/);

    // Then
    await expect(modeLink(page, 'phenotypes')).toHaveAttribute('href', '/explorer?search=age');
    await expect(modeLink(page, 'genotypes')).toHaveAttribute(
      'href',
      '/explorer/genotypes?search=age',
    );
  });

  test('middle-clicking a mode opens it in a new browser tab', async ({ page, context }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    const opened = context.waitForEvent('page');
    await modeLink(page, 'genotypes').click({ button: 'middle' });

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

  test('reaches the Genotypes placeholder and moves aria-current to it', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await modeLink(page, 'genotypes').click();

    // Then
    await expect(page).toHaveURL(/\/explorer\/genotypes$/);
    await expect(page.getByTestId('genotypes-placeholder')).toBeVisible();
    await expect(activeLinks(page)).toHaveCount(1);
    await expect(modeLink(page, 'genotypes')).toHaveAttribute('aria-current', 'page');
    await expect(modeLink(page, 'phenotypes')).not.toHaveAttribute('aria-current');
  });

  test('keeps the bar on the routes the cohort panel renders on', async ({ page }) => {
    // Given
    await page.goto('/explorer/advanced-filtering');
    await userIsLoggedIn(page);

    // Then a sibling route keeps the bar, belonging to no mode
    await expect(modeBar(page)).toBeVisible();
    await expect(activeLinks(page)).toHaveCount(0);

    // And the two full-page routes drop it, asserted only once each route has actually
    // rendered. toHaveCount(0) is satisfied by its first poll, so against a page still
    // navigating it passes whatever the bar would have gone on to do - and returning that
    // early is itself what aborts the in-flight navigation, which the root layout's load
    // turns into a redirect to '/' and playwright reports as an interrupted goto.
    await page.goto('/explorer/distributions');
    await expect(page).toHaveURL(/\/explorer\/distributions$/);
    await expect(page.getByRole('heading', { name: 'Variable Distributions' })).toBeVisible();
    await expect(modeBar(page)).toHaveCount(0);

    await page.goto('/explorer/export');
    await expect(page).toHaveURL(/\/explorer\/export$/);
    await expect(
      page.getByRole('heading', { name: 'Export Data for Research Analysis' }),
    ).toBeVisible();
    await expect(modeBar(page)).toHaveCount(0);
  });

  test('hides the bar when genomic search is off, leaving one mode', async ({ page }) => {
    // Given
    await mockApiConfig(page, genomicDisabled);

    // When
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('search-box')).toBeVisible();
    await expect(modeBar(page)).toHaveCount(0);
  });

  // The link is hidden when genomic search is off, but the URL is still reachable by hand,
  // by bookmark and by browser history.
  test('redirects /explorer/genotypes to /explorer when genomic search is off', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, genomicDisabled);

    // When
    await page.goto('/explorer/genotypes');
    await userIsLoggedIn(page);

    // Then
    await expect(page).toHaveURL(/\/explorer$/);
    await expect(page.getByTestId('genotypes-placeholder')).toHaveCount(0);
    await expect(page.getByTestId('search-box')).toBeVisible();
  });
});

test.describe('Explore mode switching', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(({ page }) => mockApiConfig(page, genomicEnabled));

  test('preserves the search term, facets, page and results with no refetch', async ({ page }) => {
    // Given a search, a selected facet and a non-default page
    const { concepts, facets } = await mockCountedSearch(page);
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await searchFor(page, 'age');
    await expect(resultCards(page)).toHaveCount(3);

    await expect(facetCheckbox(page)).toBeVisible();
    await facetCheckbox(page).click();
    await expect(facetCheckbox(page)).toBeChecked();

    await page.locator('.pagination button[aria-label="Page 2"]').click();
    await expect(currentPageButton(page)).toHaveText('2');
    await page.waitForTimeout(SETTLE_MS);

    const conceptsBefore = concepts.count;
    const facetsBefore = facets.count;

    // When the user switches to Genotypes and back
    await modeLink(page, 'genotypes').click();
    await expect(page).toHaveURL(/\/explorer\/genotypes\?search=age$/);
    await expect(page.getByTestId('genotypes-placeholder')).toBeVisible();
    await modeLink(page, 'phenotypes').click();

    // Then the search is still in the URL, not only in the store, so a refresh or a copied
    // link reproduces what is on screen
    await expect(page).toHaveURL(/\/explorer\?search=age$/);

    // And everything is as they left it, with nothing fetched again
    await expect(page.getByTestId('search-box')).toHaveValue('age');
    await expect(resultCards(page)).toHaveCount(3);
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

  test('shows no mode bar, having a single search mode', async ({ page }) => {
    // Given
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);

    // When
    await page.goto('/discover');

    // Then
    await expect(page.getByTestId('search-box')).toBeVisible();
    await expect(modeBar(page)).toHaveCount(0);
  });
});

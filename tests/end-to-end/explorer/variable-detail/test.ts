import { expect, type Page, type Route } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  facetResultPath,
  facetsResponse,
  hierarchyResponse,
  searchResultPath,
  searchResults,
} from '../../mock-data';
import {
  mockCountedSearch,
  searchCurrentPageButton as currentPageButton,
  searchFacetCheckbox as facetCheckbox,
  searchFor,
  searchResultRows as resultRows,
  SEARCH_SETTLE_MS as SETTLE_MS,
  userIsLoggedIn,
} from '../../utils';

// The variable detail page. Nothing links to it yet - ticket 11 points the result cards here -
// so these specs reach it by URL, which is also the thing that has to keep working: the page
// has to load from cold, with no search in the session to inherit a variable from.
//
// The URL carries the dataset and the concept path because the dictionary has no slug field
// yet and concept detail needs both. That shape is spelled out here rather than imported from
// src, so a change to the encoder that breaks the URL fails from the outside.

const detailUrl = (section: 'explorer' | 'discover', dataset: string, conceptPath: string) =>
  `/${section}/variable/${encodeURIComponent(dataset)}/${encodeURIComponent(conceptPath)}`;

// Backslashes, spaces and a question mark, all in one concept path - the encoding this URL
// has to survive is not hypothetical.
const variable = detailResponseCat;
const exploreUrl = detailUrl('explorer', variable.dataset, variable.conceptPath);
const discoverUrl = detailUrl('discover', variable.dataset, variable.conceptPath);

const mockConceptDetail = (page: Page, json: unknown = variable) =>
  page.route(`${conceptsDetailPath}/${variable.dataset}`, (route: Route) =>
    route.fulfill({ json }),
  );

const mockHierarchy = (page: Page) =>
  mockApiSuccess(
    page,
    `*/**/picsure/dictionary/concepts/hierarchy/${variable.dataset}`,
    hierarchyResponse,
  );

// Only client-side navigation keeps the /explorer layout - and so the search session - alive,
// and page.goto() would not. Nothing links to the detail page until ticket 11, so a synthetic
// in-app anchor stands in for the card link without tying these specs to markup that does not
// exist yet.
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

const identity = (page: Page) => page.getByTestId('variable-identity');
const backButton = (page: Page) => page.getByTestId('variable-detail-back');
const modeBar = (page: Page) => page.getByTestId('search-mode-tabs');

test.describe('Explore variable detail page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
      ],
    });
    await mockConceptDetail(page);
    await mockHierarchy(page);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
  });

  test('renders a known variable on a cold load, with no prior search', async ({ page }) => {
    // Given a URL and nothing else - no search in the session to inherit from
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then the variable's identity: name in bold, study beneath it, type badge
    await expect(identity(page)).toBeVisible();
    await expect(page.getByTestId('variable-detail-name')).toHaveText(variable.display);
    await expect(page.getByTestId('variable-detail-study')).toHaveText(variable.studyAcronym);
    await expect(page.getByTestId('variable-detail-type')).toHaveText(variable.type);

    // And Variable Information, via the existing component
    await expect(page.getByTestId('variable-detail-information')).toBeVisible();
    await expect(page.getByTestId('variable-info')).toBeVisible();

    // And Back to Search Results, as a link so middle-click and Copy Link work
    await expect(backButton(page)).toBeVisible();
    await expect(backButton(page)).toHaveAttribute('href', '/explorer');
    expect(await backButton(page).evaluate((element) => element.tagName)).toBe('A');

    // And this is a real page, not the results page with something bolted on
    await expect(page.getByTestId('search-box')).toHaveCount(0);
  });

  // The page renders inside the search chrome, which is what tells the user they are still in
  // the middle of a search rather than somewhere else entirely.
  test('keeps the mode bar with Phenotypes active, and the cohort panel above it', async ({
    page,
  }) => {
    // Given
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(modeBar(page)).toBeVisible();
    await expect(modeBar(page).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.getByTestId('search-mode-tab-phenotypes')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByTestId('search-mode-tab-genotypes')).not.toHaveAttribute('aria-current');

    // And the cohort panel, which renders on every route the mode bar renders on
    await expect(page.locator('#sidebar-right')).toBeVisible();
  });

  test('renders the data hierarchy where the deployment enables it', async ({ page }) => {
    // Given
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('variable-detail-hierarchy')).toBeVisible();
    await expect(page.getByTestId('hierarchy-component')).toBeVisible();
  });

  test('omits the data hierarchy where the deployment disables it', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_HIERARCHY', value: 'false' },
      ],
    });

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('variable-detail-information')).toBeVisible();
    await expect(page.getByTestId('variable-detail-hierarchy')).toHaveCount(0);
  });

  // Blank, or a stack trace, is the failure mode to avoid: the user cannot tell a stale link
  // from a broken app, and has no way back from either.
  test('explains a variable the dictionary does not know, and still offers a way back', async ({
    page,
  }) => {
    // Given the dictionary has never heard of it
    await page.route(`${conceptsDetailPath}/${variable.dataset}`, (route: Route) =>
      route.fulfill({ status: 404, body: 'not found' }),
    );

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('variable-detail-error')).toContainText(
      'We could not find that variable',
    );
    await expect(backButton(page)).toBeVisible();
    await expect(identity(page)).toHaveCount(0);
  });

  test('explains a key that addresses no variable at all', async ({ page }) => {
    // Given a concept path that decodes to nothing usable
    await page.goto(`/explorer/variable/${variable.dataset}/%20`);
    await userIsLoggedIn(page);

    // Then the page says so, rather than asking the dictionary about an empty concept path
    await expect(page.getByTestId('variable-detail-error')).toContainText(
      'We could not read that variable link',
    );
    await expect(backButton(page)).toBeVisible();
  });
});

// The search session belongs to /explorer/+layout.svelte, not to the results page, so a round
// trip through the detail page must not re-issue the search. Asserted by request count: the
// state assertions alone still pass if something silently refetches it all back. Same harness
// as explorer/search-state and explorer/search-modes.
test.describe('Back to Search Results', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
      ],
    });
    await mockConceptDetail(page);
    await mockHierarchy(page);
  });

  test('restores the term, facets, page and results with no refetch', async ({ page }) => {
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

    // When the user opens a variable and comes back. The detail link carries ?search= the way
    // ticket 11's cards will, so a copied link reproduces what is on screen.
    await navigateInApp(page, `${exploreUrl}?search=age`);
    await expect(identity(page)).toBeVisible();
    await expect(backButton(page)).toHaveAttribute('href', '/explorer?search=age');
    await backButton(page).click();

    // Then the search is back in the URL, not only in the store
    await expect(page).toHaveURL(/\/explorer\?search=age$/);

    // And everything is as they left it, with nothing fetched again
    await expect(page.getByTestId('search-box')).toHaveValue('age');
    await expect(resultRows(page)).toHaveCount(3);
    await expect(currentPageButton(page)).toHaveText('2');
    await expect(facetCheckbox(page)).toBeChecked();

    await page.waitForTimeout(SETTLE_MS);
    expect(concepts.count).toBe(conceptsBefore);
    expect(facets.count).toBe(facetsBefore);
  });
});

// Discover runs the same components behind its own layout instance, and that boundary is what
// keeps open-access results off the authenticated page - so it needs its own coverage.
test.describe('Discover variable detail page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
        // On, to prove Discover's single mode is the isDiscover half of the rule rather than
        // an unset flag - the detail page must not grow a mode bar it cannot use.
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
      ],
    });
    await mockConceptDetail(page);
    await mockHierarchy(page);
  });

  test('renders a known variable on a cold load, with no prior search', async ({ page }) => {
    // Given
    await page.goto(discoverUrl);

    // Then
    await expect(identity(page)).toBeVisible();
    await expect(page.getByTestId('variable-detail-name')).toHaveText(variable.display);
    await expect(page.getByTestId('variable-detail-study')).toHaveText(variable.studyAcronym);
    await expect(page.getByTestId('variable-detail-type')).toHaveText(variable.type);
    await expect(page.getByTestId('variable-info')).toBeVisible();
    await expect(page.getByTestId('variable-detail-hierarchy')).toBeVisible();

    // And Back returns to Discover, not to Explore
    await expect(backButton(page)).toHaveAttribute('href', '/discover');

    // And no mode bar, Discover having a single search mode
    await expect(modeBar(page)).toHaveCount(0);
  });

  test('returns to the Discover search with no refetch', async ({ page }) => {
    // Given a search on Discover
    const { concepts, facets } = await mockCountedSearch(page);
    await page.goto('/discover');
    await searchFor(page, 'age');
    await expect(resultRows(page)).toHaveCount(3);
    await page.waitForTimeout(SETTLE_MS);

    const conceptsBefore = concepts.count;
    const facetsBefore = facets.count;

    // When
    await navigateInApp(page, `${discoverUrl}?search=age`);
    await expect(identity(page)).toBeVisible();
    await backButton(page).click();
    await expect(page).toHaveURL(/\/discover\?search=age$/);

    // Then
    await expect(page.getByTestId('search-box')).toHaveValue('age');
    await expect(resultRows(page)).toHaveCount(3);

    await page.waitForTimeout(SETTLE_MS);
    expect(concepts.count).toBe(conceptsBefore);
    expect(facets.count).toBe(facetsBefore);
  });
});

// The guard in (picsure)/+layout.svelte matches on pathname, which is the reason both detail
// routes are thin wrappers under the existing sections rather than a route of their own. The
// concept path now rides in that pathname, so this is worth pinning.
test.describe('the stigmatising-filter guard from a detail page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'DISCOVER', value: 'true' },
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
      ],
    });
    await mockConceptDetail(page);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', {
      '\\_studies_consents\\': 100,
    });
  });

  test('still fires leaving a Discover detail page for Explore', async ({ page }) => {
    // Given a filter on a study the user has no consent for
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'filterTree',
        JSON.stringify({
          uuid: 'root',
          operator: 'AND',
          children: [
            {
              uuid: 'denied-filter',
              id: '\\denied-study\\variable\\',
              filterType: 'Categorical',
              displayType: 'restrict',
              variableName: 'Denied variable',
              allowFiltering: true,
              dataset: 'denied-study',
              categoryValues: ['Yes'],
            },
          ],
        }),
      );
    });
    await page.goto(discoverUrl);
    await expect(identity(page)).toBeVisible();

    // When
    await page.locator('#nav-link-explorer').click();

    // Then the navigation is cancelled on the detail page, exactly as it is on /discover
    await expect(page).toHaveURL(new RegExp(`${discoverUrl.replace('?', '\\?')}$`));
    await expect(page.getByTestId('sendfilter-warning')).toContainText(
      'You are not authorized to access the data in Explore based on your selected filters.',
    );
  });

  test('still fires leaving an Explore detail page for Discover', async ({ page }) => {
    // Given a genomic filter, which Discover does not support
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'genomicFilters',
        JSON.stringify([
          {
            uuid: 'standalone-genomic-filter',
            id: 'genomic',
            filterType: 'genomic',
            displayType: 'any',
            variableName: 'Genomic Filter',
            description: 'Gene with variant: BRCA1',
            allowFiltering: true,
            dataset: '',
            Gene_with_variant: ['BRCA1'],
          },
        ]),
      );
    });
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(identity(page)).toBeVisible();

    // When
    await page.locator('#nav-link-discover').click();

    // Then
    await expect(page.getByTestId('sendfilter-warning')).toContainText(
      'Your selected filters contain stigmatizing variables and/or genomic filters',
    );
  });
});

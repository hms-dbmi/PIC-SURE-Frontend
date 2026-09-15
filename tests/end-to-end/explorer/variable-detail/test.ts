import { expect, type Locator, type Page, type Route } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseNum,
  facetResultPath,
  facetsResponse,
  hierarchyResponse,
  searchResultPath,
  searchResults,
} from '../../mock-data';
import {
  cohortPanel,
  getOption,
  mockCountedSearch,
  navigateInApp,
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

// A dataset that spells a route segment. Valid data, and the case that defeats substring
// matching: `/discover/variable/explorer/...` used to read as being inside Explore already.
const ROUTE_LIKE_DATASET = 'explorer';

// The transform the mockups link Harmonization method(s) to.
const HARMONIZATION_URL =
  'https://github.com/RTIInternational/NHLBI-BDC-DMC-HV/tree/main/priority_variables_transform';

const mockConceptDetail = (page: Page, json: unknown = variable) =>
  page.route(`${conceptsDetailPath}/*`, (route: Route) => route.fulfill({ json }));

const mockHierarchy = (page: Page) =>
  mockApiSuccess(
    page,
    `*/**/picsure/dictionary/concepts/hierarchy/${variable.dataset}`,
    hierarchyResponse,
  );

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

    // And the cohort panel, which renders on every route the mode bar renders on. Located
    // through the shared helper because ALS-12835 moves it from the right sidebar to a strip
    // above the mode bar; this criterion has no other coverage, so it must follow the move
    // rather than go red.
    await expect(cohortPanel(page)).toBeVisible();
  });

  /**
   * Variable Information against the mockup it was drawn from, `p1-04-asthma-detail.png`.
   *
   * The concept is spelled out here rather than taken from `mock-data.ts` because no fixture
   * carries the four `meta` keys the design's rows come from - Accession, Subject Type,
   * Vocabulary and Harmonization method(s) are not in any fixture, in `mock-data.ts`, or in
   * the dictionary's own seed data. These values are the mockup's own.
   */
  const asthma = {
    ...variable,
    display: 'asthma',
    description: 'A bronchial disease characterized by chronic inflammation of the airways.',
    type: 'Categorical',
    table: null,
    study: null,
    meta: {
      Accession: 'MONDO:004979',
      'Subject Type': 'Human',
      Vocabulary: 'Mondo Disease Ontology',
      'Harmonization method(s)': HARMONIZATION_URL,
    },
  };

  const infoRows = (page: Page) =>
    page.getByTestId('variable-info').locator('[data-testid^="variable-info-"]');

  test("renders Variable Information in the mockup's order, one field per line", async ({
    page,
  }) => {
    // Given
    await mockConceptDetail(page, asthma);

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then the mockup's rows, with its labels, in its order - toHaveText on a list asserts
    // the count and the order, not just that each is somewhere on the page.
    await expect(infoRows(page)).toHaveText([
      'Name: asthma',
      `Description: ${asthma.description}`,
      'Accession: MONDO:004979',
      'Type: Categorical',
      'Subject Type: Human',
      'Vocabulary: Mondo Disease Ontology',
      `Harmonization method(s): ${HARMONIZATION_URL}`,
    ]);

    // And one column: every row starts at the same left edge and sits below the one before,
    // which the old one-to-three-column grid did not do. Read from layout rather than from
    // class names, so it holds whatever the classes say.
    const geometry = await infoRows(page).evaluateAll((rows) =>
      rows.map((row) => {
        const { left, top, bottom } = row.getBoundingClientRect();
        return { left, top, bottom };
      }),
    );
    expect(geometry.length).toBe(7);
    geometry.forEach((row, index) => {
      expect(row.left).toBeCloseTo(geometry[0].left, 0);
      if (index > 0) expect(row.top).toBeGreaterThanOrEqual(geometry[index - 1].bottom - 1);
    });
  });

  test('renders Harmonization method(s) as a link to the transform', async ({ page }) => {
    // Given
    await mockConceptDetail(page, asthma);

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    const link = page.getByTestId('variable-info-harmonization-methods').getByRole('link');
    await expect(link).toHaveAttribute('href', HARMONIZATION_URL);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // What every deployment we can see actually sends: `detailResponseCat`'s bag holds `values`
  // and `description` and none of the design's keys. Those rows are omitted rather than
  // rendered empty, and `name` is not shown as an Accession - the dictionary defines it as
  // the last segment of the concept path, not as an identifier in any namespace.
  test('omits the rows a variable has no values for', async ({ page }) => {
    // Given the fixture concept, whose meta carries none of the four keys
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(infoRows(page)).toHaveText([
      `Name: ${variable.display}`,
      `Description: ${variable.description}`,
      `Type: ${variable.type}`,
    ]);
    const variableInfo = page.getByTestId('variable-info');
    await expect(variableInfo).not.toContainText('Accession:');
    await expect(variableInfo).not.toContainText(variable.name);
    await expect(variableInfo).not.toContainText('values:');
  });

  // The branded headings (`explorePage.resultInfo.*`) are not reachable from here: they come
  // from the deployment's `configuration.json`, not from an API branding row, so
  // `mockApiConfig` cannot set them and an e2e assertion on them would pass whatever the
  // component did with the config. `tests/component/ResultInfoComponent.test.ts` covers them
  // at the layer they are observable.

  // Dataset and Study survive the rewrite: a study's link, phase and accession are on screen
  // nowhere else in the application.
  test('keeps Dataset and Study Information below the variable', async ({ page }) => {
    // Given
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('dataset-info')).toContainText(`Name: ${variable.table.display}`);
    await expect(page.getByTestId('study-info')).toContainText(
      `Study Name: ${variable.study.fullName}`,
    );
    await expect(page.getByTestId('study-info')).toContainText(
      `study_link: ${variable.study.meta.study_link}`,
    );
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

  // A 200 is not proof of a concept, and rendering one of these gave an empty heading plus
  // an information card that spun forever - the blank page the criterion forbids.
  test('explains a 200 that is not a concept', async ({ page }) => {
    // Given
    await mockConceptDetail(page, {});

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('variable-detail-error')).toContainText(
      'We could not find that variable',
    );
    await expect(identity(page)).toHaveCount(0);
    await expect(page.getByTestId('variable-info')).toHaveCount(0);
  });

  // A dictionary outage must not tell every user their own link is stale, or they retry and
  // give up instead of reporting a service problem.
  test('tells a dictionary outage apart from a stale link', async ({ page }) => {
    // Given
    await page.route(`${conceptsDetailPath}/*`, (route: Route) =>
      route.fulfill({ status: 500, body: 'boom' }),
    );

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then
    const alert = page.getByTestId('variable-detail-error');
    await expect(alert).toContainText('We could not load that variable');
    await expect(alert).toContainText('contact an administrator');
    await expect(alert).not.toContainText('since the link was made');
  });
});

/**
 * The dataset segment reaches a request path, so the route has to constrain it.
 *
 * SvelteKit decodes `%2F` and `%5C` only after matching routes, so `..%2F..%2F..` arrives as
 * one `dataset` parameter reading `../../..`. Unconstrained, `getConceptDetails` interpolated
 * that into `picsure/dictionary/concepts/detail/{dataset}`, and `api.send` resolves its path
 * against `window.location.origin` - so `fetch` normalised the `..` away and aimed an
 * authenticated, token-bearing POST, carrying a caller-supplied string body, at
 * `/psama/studyAccess`: the URL, method and body shape of `addManualRole()`.
 *
 * Two independent checks close it - the route's parameter validation and
 * `encodeURIComponent` in the dictionary client - so this asserts the outcome: a readable
 * error, and no request leaving the dictionary namespace.
 */
test.describe('a traversal-shaped dataset', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(({ page }) => mockApiConfig(page));

  // RegExps, not globs, so there is no doubt these match - a counter that never fires would
  // make the assertions below vacuous. The first test proves both of them do.
  const conceptDetailUrl = /\/picsure\/dictionary\/concepts\/detail\//;
  const privilegedUrl = /\/psama\/(studyAccess|role|privilege)/;

  /** Counts what reaches the dictionary, and what reaches an endpoint that grants access. */
  async function countRequests(page: Page) {
    const dictionary = { count: 0 };
    const privileged = { count: 0 };
    await page.route(conceptDetailUrl, (route: Route) => {
      dictionary.count += 1;
      return route.fulfill({ json: variable });
    });
    await page.route(privilegedUrl, (route: Route) => {
      privileged.count += 1;
      return route.fulfill({ json: {} });
    });
    return { dictionary, privileged };
  }

  // The control. Without it the traversal cases below could pass on a counter that never
  // matches anything.
  test('the counters fire for an ordinary dataset', async ({ page }) => {
    const { dictionary, privileged } = await countRequests(page);

    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(identity(page)).toBeVisible();

    await page.waitForTimeout(SETTLE_MS);
    expect(dictionary.count).toBeGreaterThan(0);
    expect(privileged.count).toBe(0);
  });

  for (const dataset of [
    '..%2F..%2F..%2F..%2Fpsama%2FstudyAccess',
    '..%5C..%5C..%5C..%5Cpsama%5CstudyAccess',
    '..%2F..%2F..%2F..%2Fpsama%2Frole',
  ]) {
    test(`is refused, and sends nothing, for ${dataset}`, async ({ page }) => {
      // Given
      const { dictionary, privileged } = await countRequests(page);

      // When the crafted link is opened
      await page.goto(`/explorer/variable/${dataset}/${encodeURIComponent(variable.conceptPath)}`);
      await userIsLoggedIn(page);

      // Then the page refuses the key, rather than looking anything up
      await expect(page.getByTestId('variable-detail-error')).toContainText(
        'We could not read that variable link',
      );
      await expect(identity(page)).toHaveCount(0);
      await expect(backButton(page)).toBeVisible();

      await page.waitForTimeout(SETTLE_MS);
      expect(dictionary.count).toBe(0);
      expect(privileged.count).toBe(0);
    });
  }
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
    // A dataset that spells `explorer`, so the guard cannot decide the section by substring
    await page.goto(detailUrl('discover', ROUTE_LIKE_DATASET, variable.conceptPath));
    await expect(identity(page)).toBeVisible();

    // When
    await page.locator('#nav-link-explorer').click();

    // Then the navigation is cancelled on the detail page, exactly as it is on /discover
    await expect(page).toHaveURL(/\/discover\/variable\//);
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
    // A dataset that spells `discover`, so the guard cannot decide the target by substring
    await page.goto(detailUrl('explorer', 'discover', variable.conceptPath));
    await userIsLoggedIn(page);
    await expect(identity(page)).toBeVisible();

    // When
    await page.locator('#nav-link-discover').click();

    // Then
    await expect(page.getByTestId('sendfilter-warning')).toContainText(
      'Your selected filters contain stigmatizing variables and/or genomic filters',
    );
  });

  // The mirror image: an Explore detail page whose dataset spells `discover` must not trip
  // the guard on its own URL, or every variable in that dataset is unreachable.
  test('does not fire on an Explore detail page whose dataset spells discover', async ({
    page,
  }) => {
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

    // When navigating from the results page to a detail page in a dataset named `discover`
    await page.goto('/explorer');
    await userIsLoggedIn(page);
    await navigateInApp(page, detailUrl('explorer', 'discover', variable.conceptPath));

    // Then the page loads and no warning appears
    await expect(identity(page)).toBeVisible();
    await expect(page.getByTestId('sendfilter-warning')).toHaveCount(0);
  });
});

/*
 * Acting on the variable from its own page.
 *
 * Ticket 11 strips the per-row Info / Filter / Hierarchy / Add-for-Analysis icons off the
 * search results, so all four actions have to exist here before the icons go. Add for
 * Analysis is the only one not duplicated anywhere else in the UI.
 */
test.describe('acting on the variable from its own page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  const strip = (page: Page) => page.getByTestId('results-summary-strip');
  const panelBody = (page: Page) => page.locator('#results-panel');
  const filterCount = (page: Page) => page.getByTestId('results-panel-filter-count');
  const participants = (page: Page) => page.locator('#result-count-number');
  const exportToggle = (page: Page) => page.getByTestId('variable-detail-export-toggle');
  const filterSection = (page: Page) => page.getByTestId('variable-detail-filter');
  // Unscoped on purpose. `add-filter` was AddFilter's button *and* HierarchyComponent's, and
  // both rendered on this page, so any unscoped locator for it was a strict-mode violation;
  // the two ids are now distinct and the filter action has this page's own name.
  const addFilterButton = (page: Page) => page.getByTestId('filter-participants');

  const COUNT_PATH = '*/**/picsure/hpds/auth/v3/query/sync';
  const EXPORT_FEATURES = [
    { name: 'ENABLE_HIERARCHY', value: 'true' },
    { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
  ];

  /**
   * Answers the count query with a different number once this variable is part of it, so
   * "the participant count updates" is an observable change rather than the same figure
   * re-rendered. `detailResponseCat`'s concept path is the only thing in the query body that
   * could carry this phrase.
   */
  const mockCounts = (page: Page) =>
    page.route(COUNT_PATH, (route: Route) => {
      const filtered = (route.request().postData() ?? '').includes('heart attack');
      return route.fulfill({ json: filtered ? '4242' : '9999' });
    });

  /** Selects the first value and adds the filter. */
  async function addFilterFromPage(page: Page) {
    const option = await getOption(filterSection(page));
    await option.click();
    await addFilterButton(page).click();
  }

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: EXPORT_FEATURES });
    await mockConceptDetail(page);
    await mockHierarchy(page);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockCounts(page);
  });

  test('adds a filter, updating the cohort, and stays on the page', async ({ page }) => {
    // Given a cold load with a collapsed panel and an unfiltered count
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(participants(page)).toHaveText('9,999');
    await expect(filterCount(page)).toHaveText(/^No filters added/);

    // When
    await addFilterFromPage(page);

    // Then the chip is in the cohort panel, which opened itself to show it
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(panelBody(page)).toBeVisible();
    await expect(page.getByTestId(`added-filter-${variable.conceptPath}`)).toBeVisible();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);

    // And the participant count is the filtered one
    await expect(participants(page)).toHaveText('4,242');

    // And the user is still on the detail page, not back on the results list
    await expect(page).toHaveURL(new RegExp(`/explorer/variable/${variable.dataset}/`));
    await expect(identity(page)).toBeVisible();
    await expect(page.getByTestId('search-box')).toHaveCount(0);
  });

  test('opens with the selection of a filter the variable already has', async ({ page }) => {
    // Given a filter added from this page
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await addFilterFromPage(page);
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);

    // When the page is loaded again - the filter tree comes back out of sessionStorage, and
    // the concept is fetched fresh
    await page.reload();
    await userIsLoggedIn(page);
    await expect(identity(page)).toBeVisible();

    // Then the interface opens on what is already selected, not on a blank filter
    const selected = filterSection(page).locator('#selected-options-container');
    await expect(selected.locator('input[type="checkbox"]')).toHaveCount(1);
    await expect(selected).toContainText('Yes');
    await expect(filterSection(page).locator('#options-container')).toContainText('No');

    // And adding again edits that filter rather than leaving two on one variable
    await addFilterFromPage(page);
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await expect(page.locator('[data-testid^="added-filter-"]')).toHaveCount(1);
  });

  test('adds the variable for analysis, and removes it again', async ({ page }) => {
    // Given
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(exportToggle(page)).toHaveText(/Add for Analysis/);
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'false');

    // When
    await exportToggle(page).click();

    // Then it is in Added Variables, and the panel opened itself to show it
    await expect(strip(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId(`added-export-${variable.conceptPath}`)).toBeVisible();
    await expect(exportToggle(page)).toHaveText(/Remove from Analysis/);

    // And it comes back off again
    await exportToggle(page).click();
    await expect(page.getByTestId(`added-export-${variable.conceptPath}`)).toHaveCount(0);
    await expect(exportToggle(page)).toHaveText(/Add for Analysis/);
  });

  /*
   * EXISTING-ISSUES item 18, from the outside.
   *
   * `Actions.svelte` decides whether a variable is already added with
   * `$exports.includes(exportItem)` - reference equality against a fresh object literal - so
   * once anything refetches the concept the button reads "Remove from Analysis" and does
   * nothing. `exports` is module state and survives navigation, so a round trip through the
   * results page and back is all it takes.
   */
  test('removes the variable after leaving the page and coming back', async ({ page }) => {
    // Given a variable added for analysis
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await exportToggle(page).click();
    await expect(page.getByTestId(`added-export-${variable.conceptPath}`)).toBeVisible();

    // When the user leaves and returns, so the concept is fetched again. Client-side, so the
    // export outlives the trip.
    await navigateInApp(page, '/explorer');
    await expect(page.getByTestId('search-box')).toBeVisible();
    await navigateInApp(page, exploreUrl);
    await expect(identity(page)).toBeVisible();
    await expect(page.getByTestId(`added-export-${variable.conceptPath}`)).toBeVisible();

    // Then the toggle still knows it is added, and still takes it off
    await expect(exportToggle(page)).toHaveText(/Remove from Analysis/);
    await exportToggle(page).click();

    await expect(page.getByTestId(`added-export-${variable.conceptPath}`)).toHaveCount(0);
    await expect(exportToggle(page)).toHaveText(/Add for Analysis/);
  });

  /*
   * Why the gate is here and not left to ticket 13: this page is addressed by URL, so a
   * shared or hand-edited link can name a concept the value interface cannot express.
   * AddFilter's add button is unconditional, and `addNewFilter` falls through to
   * `createNumericFilter(data, undefined, undefined)` for a type it has no inputs for - so
   * ungated, this rendered a bare `+` under the heading that added a filter restricting
   * nothing to the user's cohort.
   */
  test('offers nothing to fill in for a concept with no values', async ({ page }) => {
    // Given a link naming a category rather than a leaf variable
    await mockConceptDetail(page, { ...variable, type: 'AnyRecordOf' });

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(identity(page)).toBeVisible();

    // Then the page says why, and there is no button to press
    await expect(page.getByTestId('variable-detail-filter-unavailable')).toContainText(
      'This concept has no values to filter on',
    );
    await expect(page.getByTestId('variable-filter-panel')).toHaveCount(0);
    await expect(addFilterButton(page)).toHaveCount(0);
    await expect(filterCount(page)).toHaveText(/^No filters added/);
  });

  /*
   * Two views of one filter, both on this page: the cohort panel's edit pencil opens its own
   * AddFilter in a modal over it, and `updateFilter` preserves the uuid. Keyed on identity
   * alone, this page's interface would still hold the selection it read at mount, and the
   * next add here would write that stale selection back over the edit made in the modal.
   */
  test('does not undo an edit made from the cohort panel', async ({ page }) => {
    // Given a filter on this variable, restricted to its first value
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await addFilterFromPage(page);
    const chip = page.getByTestId(`added-filter-${variable.conceptPath}`);
    await expect(chip).toBeVisible();

    // When it is edited from the panel to a second value
    await chip.getByRole('button', { name: 'Edit Filter' }).click();
    const modal = page.getByRole('dialog');
    const modalOption = await getOption(modal);
    await modalOption.click();
    await modal.getByTestId('add-filter').click();
    await expect(modal).toHaveCount(0);

    // Then this page's interface shows both values, not the one it read at mount
    const selected = filterSection(page).locator('#selected-options-container');
    await expect(selected.locator('input[type="checkbox"]')).toHaveCount(2);

    // And adding from this page carries that edit forward rather than reverting it
    await addFilterButton(page).click();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    await chip.getByRole('button', { name: 'See details' }).click();
    await expect(chip).toContainText('Restricting to 2 values');
  });

  test('offers no Add for Analysis where the deployment disables exports', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [{ name: 'ENABLE_HIERARCHY', value: 'true' }],
    });

    // When
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(identity(page)).toBeVisible();

    // Then the toggle is absent, and the rest of the page is not
    await expect(exportToggle(page)).toHaveCount(0);
    await expect(filterSection(page)).toBeVisible();
  });
});

// Discover runs the same component behind its own layout, and open access is where the two
// rules below differ from Explore: no Add for Analysis at all, and no filtering on a variable
// the dictionary marks unfilterable.
test.describe('acting on the variable in open access', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
        // On, so the toggle's absence is the open-access rule rather than an unset flag.
        { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
      ],
    });
    await mockHierarchy(page);
  });

  test('offers the filter interface but no Add for Analysis', async ({ page }) => {
    // Given
    await mockConceptDetail(page);

    // When
    await page.goto(discoverUrl);

    // Then
    await expect(page.getByTestId('variable-detail-filter')).toBeVisible();
    await expect(page.getByTestId('variable-filter-panel')).toBeVisible();
    await expect(page.getByTestId('variable-detail-export-toggle')).toHaveCount(0);
    await expect(page.getByTestId('variable-detail-filter-disabled')).toHaveCount(0);
  });

  /*
   * A related variable is a second way into the cohort, and the page's own gate looks only at
   * the variable it is about. Ungated, ticking a value on an unfilterable related variable
   * built its filter and put it in the open-access query - around a restriction the
   * application makes on the results row and on that variable's own detail page.
   *
   * Nothing reaches this from a deployment today: the dictionary has no field for related
   * variables, so the panel reads them off `children`, which concept detail sends as `null`.
   */
  test('refuses filtering on an unfilterable related variable', async ({ page }) => {
    // Given a filterable variable with an unfilterable related one
    const child = {
      ...variable,
      conceptPath: '\\SOMEDATA\\questionnaire\\disease\\infection status\\',
      display: 'Infection status',
      values: ['Infected', 'Non-infected'],
      allowFiltering: false,
    };
    await mockConceptDetail(page, { ...variable, children: [child] });

    // When
    await page.goto(discoverUrl);
    await expect(page.getByTestId('variable-filter-panel')).toBeVisible();
    await page.getByTestId('related-variable-toggle').click();

    // Then it says why, rather than offering values that cannot be filtered on
    await expect(page.getByTestId('related-variable-disabled')).toContainText(
      'Filtering is not available for this variable',
    );
    const related = page.getByTestId('related-variable');
    await expect(related.locator('input[type="checkbox"]')).toHaveCount(0);

    // And the main variable is still filterable, so this is the child's own rule
    await expect(page.getByTestId('variable-detail-filter-disabled')).toHaveCount(0);
    await expect(page.getByTestId('optional-selection-list').first()).toBeVisible();
  });

  // The same rule as the results row's filter icon: open access *and* the dictionary
  // refusing, not either on its own.
  test('refuses filtering, with an explanation, for an unfilterable variable', async ({ page }) => {
    // Given
    await mockConceptDetail(page, { ...variable, allowFiltering: false });

    // When
    await page.goto(discoverUrl);

    // Then
    await expect(page.getByTestId('variable-detail-filter-disabled')).toContainText(
      'Filtering is not available for this variable',
    );
    await expect(page.getByTestId('variable-filter-panel')).toHaveCount(0);
  });
});

/*
 * The designed filter panel: `p1-04-asthma-detail.png` and `p1-05-asthma-values-selected.png`
 * for a categorical variable, `p1-10-eosinophil-detail.png` for a continuous one, and
 * `p2-10-followup-detail.png` / `p2-11-followup-expanded.png` for one with related variables.
 */
test.describe('the designed filter panel', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  const panel = (page: Page) => page.getByTestId('variable-filter-panel');
  const searchBox = (page: Page) => panel(page).locator('input[type="search"]');
  const selectAll = (page: Page) => panel(page).locator('#select-all');
  const filterParticipants = (page: Page) => page.getByTestId('filter-participants');
  const optionsColumn = (page: Page) => panel(page).locator('#options-container').first();
  const selectedColumn = (page: Page) => panel(page).locator('#selected-options-container').first();
  const filterCount = (page: Page) => page.getByTestId('results-panel-filter-count');

  const values = async (locator: Locator) =>
    (await locator.getByRole('listitem').allInnerTexts()).map((text) => text.trim());

  const box = async (locator: Locator) => {
    const rect = await locator.boundingBox();
    if (!rect) throw new Error('element has no box');
    return rect;
  };

  /** A continuous variable, so the min/max interface has bounds to render. */
  const continuous = { ...detailResponseNum, allowFiltering: true };

  /**
   * A variable with related variables, as `p2-10` has.
   *
   * The dictionary has no field for these, so the panel reads them off `children` - the only
   * thing on a concept detail response that names concepts belonging to this one. Spelled out
   * here because no fixture holds a categorical concept with categorical children.
   */
  const relatedConcepts = [
    {
      ...variable,
      conceptPath: '\\SOMEDATA\\questionnaire\\disease\\infection status\\',
      display: 'Infection status',
      name: 'infection_status',
      values: ['Infected', 'Non-infected'],
    },
    {
      ...variable,
      conceptPath: '\\SOMEDATA\\questionnaire\\disease\\months post index\\',
      display: 'Months-post-index',
      name: 'months_post_index',
      values: ['00 - Acute', '03m post-index'],
    },
  ];
  const followUp = {
    ...variable,
    display: 'Asthma - Follow-up',
    values: ['Yes', 'No', 'I prefer not to answer'],
    children: relatedConcepts,
  };

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'ENABLE_HIERARCHY', value: 'true' }] });
    await mockConceptDetail(page);
    await mockHierarchy(page);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, '*/**/picsure/hpds/auth/v3/query/sync', '9999');
  });

  /** Opens this page's URL on `concept`, whatever concept the URL happens to name. */
  async function open(page: Page, concept: unknown = variable) {
    await mockConceptDetail(page, concept);
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(panel(page)).toBeVisible();
  }

  // Search and Select All above the value checkboxes on the left; Selected values and Filter
  // Participants on the right. Read from layout, not from class names, so it holds whatever
  // the classes say.
  test('puts search and Select All over the values, and the action over Selected values', async ({
    page,
  }) => {
    await open(page);

    const search = await box(searchBox(page));
    const all = await box(selectAll(page));
    const firstValue = await box(optionsColumn(page).getByRole('listitem').first());
    const action = await box(filterParticipants(page));
    const selectedHeading = await box(panel(page).getByText('Selected values:'));

    // Select All beside the search box, both of them above the values
    expect(all.x).toBeGreaterThan(search.x + search.width - 1);
    expect(firstValue.y).toBeGreaterThanOrEqual(search.y + search.height - 1);
    expect(firstValue.y).toBeGreaterThanOrEqual(all.y + all.height - 1);

    // The right-hand column is to the right of the values, with the action in its top corner
    expect(selectedHeading.x).toBeGreaterThan(firstValue.x + firstValue.width - 1);
    expect(action.x).toBeGreaterThan(selectedHeading.x);
    expect(action.y).toBeLessThan(firstValue.y);
  });

  // SPEC.md:411-415 and all four detail mockups put the filter interface between the
  // variable's identity and Variable Information. Ticket 10 left it below and deferred this.
  test('sits under the variable identity and above Variable Information', async ({ page }) => {
    await open(page);
    await expect(page.getByTestId('variable-detail-hierarchy')).toBeVisible();

    const tops = await Promise.all(
      [
        'variable-identity',
        'variable-detail-filter',
        'variable-detail-information',
        'variable-detail-hierarchy',
      ].map(async (id) => (await box(page.getByTestId(id))).y),
    );

    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(new Set(tops).size).toBe(tops.length);
  });

  test('narrows the value list as the user types', async ({ page }) => {
    await open(page);
    expect(await values(optionsColumn(page))).toEqual(['Yes', 'No', "Don't know"]);

    await searchBox(page).fill('kno');
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(1);
    expect(await values(optionsColumn(page))).toEqual(["Don't know"]);

    // And widens again, so what narrowed the list is the term and not a one-way filter
    await searchBox(page).fill('');
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(3);
  });

  test('moves a ticked value into Selected values, and an unticked one back', async ({ page }) => {
    await open(page);

    await optionsColumn(page).getByRole('listitem').first().click();
    expect(await values(selectedColumn(page))).toEqual(['Yes']);
    await expect(selectedColumn(page).locator('input[type="checkbox"]')).toBeChecked();
    expect(await values(optionsColumn(page))).toEqual(['No', "Don't know"]);

    // Unticking it in the right-hand column sends it back to the left
    await selectedColumn(page).getByRole('listitem').first().click();
    await expect(selectedColumn(page).getByRole('listitem')).toHaveCount(0);
    expect(await values(optionsColumn(page))).toContain('Yes');
    await expect(optionsColumn(page).locator('#option-yes input')).not.toBeChecked();
  });

  test('waits for a value before it will filter', async ({ page }) => {
    await open(page);
    await expect(filterParticipants(page)).toBeDisabled();

    await optionsColumn(page).getByRole('listitem').first().click();
    await expect(filterParticipants(page)).toBeEnabled();

    // And back again: a panel the user emptied cannot add a filter that restricts nothing
    await selectedColumn(page).getByRole('listitem').first().click();
    await expect(filterParticipants(page)).toBeDisabled();
  });

  // Select All means "filter to any value" - selecting everything constrains nothing - so the
  // chip has to say that rather than list every value the variable has.
  test('reads Select All back as any value, not as a list of every value', async ({ page }) => {
    await open(page);

    await selectAll(page).click();
    expect(await values(selectedColumn(page))).toEqual(['Yes', 'No', "Don't know"]);
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(0);

    await filterParticipants(page).click();
    const chip = page.getByTestId(`added-filter-${variable.conceptPath}`);
    await expect(chip).toBeVisible();
    await chip.getByRole('button', { name: 'See details' }).click();

    await expect(chip).toContainText('Restricting to any value.');
    await expect(chip).not.toContainText("Values: Yes, No, Don't know");
  });

  /*
   * Select All means every value the search box admits, not every value there is.
   *
   * With `allOptions` supplied - which this panel does - it assigned that whole list and
   * ignored the term. So narrowing the column and pressing Select All selected the values the
   * term had excluded too, and because a selection covering every value is written as "filter
   * to any value", a deliberate narrowing came out as an unconstrained filter. It sits
   * directly beside the search box in `p1-04`.
   */
  test('selects only the values the search box admits', async ({ page }) => {
    await open(page);

    // A term that admits two of the three values
    await searchBox(page).fill('o');
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(2);

    await selectAll(page).click();
    expect(await values(selectedColumn(page))).toEqual(['No', "Don't know"]);
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(0);

    // The value the term excluded was not selected, and is still there to pick. `values()`
    // reads a snapshot, so the count is waited on first - the search box debounces.
    await searchBox(page).fill('');
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(1);
    expect(await values(optionsColumn(page))).toEqual(['Yes']);

    // And the filter is a restriction, not the unconstrained one every value would give
    await filterParticipants(page).click();
    const chip = page.getByTestId(`added-filter-${variable.conceptPath}`);
    await chip.getByRole('button', { name: 'See details' }).click();
    await expect(chip).toContainText('Restricting to 2 values.');
    await expect(chip).not.toContainText('Restricting to any value.');
  });

  /*
   * The other half of "any value": reading it back.
   *
   * Select All writes a filter carrying *no* values, which is how the cohort records "filter
   * to any value". Re-opening the page therefore has to read an empty value list as every
   * value ticked rather than as none - and if it did not, the next press of the action would
   * turn the user's unconstrained filter into a filter on nothing.
   */
  test('re-opens a Select All filter with every value ticked', async ({ page }) => {
    await open(page);
    await selectAll(page).click();
    await filterParticipants(page).click();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);

    // The filter tree comes back out of sessionStorage, and the concept is fetched fresh
    await page.reload();
    await userIsLoggedIn(page);
    await expect(panel(page)).toBeVisible();

    expect(await values(selectedColumn(page))).toEqual(['Yes', 'No', "Don't know"]);
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(0);

    // And pressing the action again edits that filter rather than adding a second, still
    // unconstrained
    await filterParticipants(page).click();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);
    const chip = page.getByTestId(`added-filter-${variable.conceptPath}`);
    await chip.getByRole('button', { name: 'See details' }).click();
    await expect(chip).toContainText('Restricting to any value.');
  });

  // p1-10: a continuous variable gets Min and Max, with the variable's own bounds as the
  // placeholders, and no value list at all.
  test('offers min and max, not a value list, for a continuous variable', async ({ page }) => {
    await open(page, continuous);

    await expect(page.getByTestId('min-input')).toHaveAttribute('placeholder', '0');
    await expect(page.getByTestId('max-input')).toHaveAttribute('placeholder', '99');
    await expect(panel(page).getByTestId('optional-selection-list')).toHaveCount(0);
    await expect(selectAll(page)).toHaveCount(0);

    // Both bounds blank is a filter - everyone with a measurement - so the action is offered
    await expect(filterParticipants(page)).toBeEnabled();
    await page.getByTestId('min-input').fill('21');
    await filterParticipants(page).click();

    const chip = page.getByTestId(`added-filter-${continuous.conceptPath}`);
    await chip.getByRole('button', { name: 'See details' }).click();
    await expect(chip).toContainText('Restricting to greater than 21.');
  });

  /*
   * Keyboard operability, driven with keys.
   *
   * Every control in the panel has to be reachable by Tab and workable by Space or Enter. The
   * trail pins the order too: search, Select All, the values, then the action - the reading
   * order of the mockup.
   */
  test('is operable from the keyboard end to end', async ({ page, browserName }) => {
    // Not WebKit. Safari leaves buttons and checkboxes out of the tab order unless the user
    // turns on "Press Tab to highlight each item on a webpage", and Playwright's WebKit
    // inherits that: the trail there runs from the search box straight past every control in
    // this panel. That is a browser preference, not something this page can be built to
    // satisfy, and asserting around it would leave the test passing on markup no keyboard
    // user could operate anywhere else.
    test.skip(browserName === 'webkit', 'WebKit omits buttons and checkboxes from tab order');
    await open(page);

    /** What Tab lands on, named by whatever identifies it. */
    const trail = async (steps: number) => {
      const seen: string[] = [];
      for (let step = 0; step < steps; step += 1) {
        await page.keyboard.press('Tab');
        seen.push(
          await page.evaluate(() => {
            const element = document.activeElement as HTMLElement | null;
            if (!element) return 'none';
            return (
              element.getAttribute('data-testid') ||
              element.id ||
              (element as HTMLInputElement).value ||
              element.tagName
            );
          }),
        );
      }
      return seen;
    };

    // Space works the checkbox the keyboard is on, and focus follows the value it moved -
    // without which every value costs a tab in from the top of the page again
    await backButton(page).focus();
    await trail(3);
    await page.keyboard.press('Space');
    expect(await values(selectedColumn(page))).toEqual(['Yes']);
    await expect(selectedColumn(page).locator('#option-yes input')).toBeFocused();

    // With a value picked the action is live - it is disabled before that, and a disabled
    // button is deliberately not a tab stop. The search box has no id and an empty value, so
    // Tab reports it by its element name.
    await backButton(page).focus();
    const reached = await trail(6);
    expect(reached).toEqual([
      'INPUT',
      'select-all',
      'No',
      "Don't know",
      'filter-participants',
      'Yes',
    ]);

    // Enter works the action, from the tab stop before the value already picked
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);

    // And a value whose text is not a legal CSS selector, which is how the moved checkbox
    // used to be found: `#option-don't-know input` throws a DOMException, so the value moved
    // but focus fell to the document body - the one thing this case is about. Three of this
    // fixture's values contain an apostrophe or a space.
    await backButton(page).focus();
    await trail(4);
    await page.keyboard.press('Space');
    expect(await values(selectedColumn(page))).toEqual(["Don't know", 'Yes']);
    await expect(selectedColumn(page).locator(`input[value="Don't know"]`)).toBeFocused();
  });

  test('names both value columns for a screen reader', async ({ page }) => {
    await open(page);

    const valueGroup = page.getByRole('group', {
      name: `Values for ${variable.display}`,
      exact: true,
    });
    await expect(valueGroup).toBeVisible();
    await expect(valueGroup.getByRole('listitem')).toHaveCount(3);
    await expect(
      page.getByRole('group', {
        name: `Selected values for ${variable.display}`,
        exact: true,
      }),
    ).toBeVisible();
  });

  /*
   * The concept is handed to the panel, not fetched by it.
   *
   * The interface this replaced called `getConceptDetails` again in `onMount` for a
   * categorical variable with no filter, though the page had already loaded the same concept
   * including its values - one redundant POST per page view.
   */
  test('asks the dictionary for the concept once', async ({ page }) => {
    const detail = { count: 0 };
    await page.route(/\/picsure\/dictionary\/concepts\/detail\//, (route: Route) => {
      detail.count += 1;
      return route.fulfill({ json: variable });
    });

    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(panel(page)).toBeVisible();
    await expect(optionsColumn(page).getByRole('listitem')).toHaveCount(3);

    await page.waitForTimeout(SETTLE_MS);
    expect(detail.count).toBe(1);
  });

  // The hierarchy's add button and the value list's used to share one test id, which made any
  // unscoped locator for it ambiguous on this page.
  test('leaves one element per test id on the page', async ({ page }) => {
    await open(page);
    await expect(page.getByTestId('variable-detail-hierarchy')).toBeVisible();

    await expect(filterParticipants(page)).toHaveCount(1);
    await expect(page.getByTestId('add-hierarchy-filter')).toHaveCount(1);
    await expect(page.getByTestId('add-filter')).toHaveCount(0);
  });

  // p2-10 and p2-11: the variable names itself on the action's line, and its related variables
  // stack below with their own value lists.
  test('names itself beside the action when it has related variables', async ({ page }) => {
    await open(page, followUp);

    const name = panel(page).getByTestId('variable-filter-panel-name');
    await expect(name).toHaveText(followUp.display);
    const nameBox = await box(name);
    const action = await box(filterParticipants(page));
    expect(action.x).toBeGreaterThan(nameBox.x);
    expect(Math.abs(action.y - nameBox.y)).toBeLessThan(action.height);

    // And a variable with none does not carry a second copy of its own name
    await open(page);
    await expect(panel(page).getByTestId('variable-filter-panel-name')).toHaveCount(0);
  });

  test('stacks related variables below, unconstrained until they are touched', async ({ page }) => {
    await open(page, followUp);

    const related = page.getByTestId('related-variable');
    await expect(related).toHaveCount(2);
    await expect(related.first()).toContainText('Infection status');
    await expect(related.last()).toContainText('Months-post-index');

    // Collapsed to start with, as p2-10 has them
    const toggle = related.first().getByTestId('related-variable-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(related.first().getByTestId('optional-selection-list')).toHaveCount(0);

    // Expanded, its own values on the left and "All included by default" on the right
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await values(related.first().locator('#options-container'))).toEqual([
      'Infected',
      'Non-infected',
    ]);
    await expect(related.first().getByTestId('selected-empty')).toHaveText(
      'All included by default',
    );

    // The chevron sits at the right edge of the row, level with the section's name and over
    // the Selected values column - which is where `p2-10` draws it collapsed and `p2-11`
    // draws it expanded. Measured rather than argued, because the two mockups can be read as
    // putting it in two different places.
    const chevron = await box(toggle.locator('i'));
    const title = await box(toggle.locator('span'));
    const selectedColumnLeft = (await box(related.first().locator('#selected-options-container')))
      .x;
    expect(chevron.x).toBeGreaterThan(selectedColumnLeft);
    expect(Math.abs(chevron.y - title.y)).toBeLessThan(title.height);
  });

  test('adds a filter for a related variable only once it is given values', async ({ page }) => {
    await open(page, followUp);

    // The main variable alone: one filter, and nothing for the untouched related variables
    await optionsColumn(page).getByRole('listitem').first().click();
    await filterParticipants(page).click();
    await expect(filterCount(page)).toHaveText(/^1 filter added$/);

    // Then a related variable's value: its own filter, on its own concept path
    const infection = page.getByTestId('related-variable').first();
    await infection.getByTestId('related-variable-toggle').click();
    await infection.locator('#options-container').getByRole('listitem').first().click();
    await filterParticipants(page).click();

    await expect(filterCount(page)).toHaveText(/^2 filters added$/);
    await expect(page.getByTestId(`added-filter-${relatedConcepts[0].conceptPath}`)).toBeVisible();
  });
});

import { expect, type Locator, type Page, type Route } from '@playwright/test';

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

  /**
   * What every deployment we can see actually sends: `detailResponseCat`'s bag holds `values`
   * and `description` and none of the design's keys, so Unit, Subject Type, Vocabulary and
   * Harmonization method(s) are omitted rather than rendered empty.
   *
   * Accession is *not* omitted. It falls back to `name`, which is the row this page showed
   * before the redesign - `name` is a column of its own, mapped verbatim by
   * `ConceptResultSetUtil`, and on the dictionary's own dbGaP rows it is the variable
   * accession (`phv00004260`) while the last path segment is the `display` (`FM219`).
   * `Concept.java` documenting it as "the right most concept in the concept path" holds only
   * for ACT/ICD-10 rows, where `name`, `display` and the last segment coincide.
   */
  test('omits the rows a variable has no values for, and keeps Accession and the bag', async ({
    page,
  }) => {
    // Given the fixture concept, whose meta carries none of the design's keys
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);

    // Then the designed rows it does have values for, and no empty ones
    await expect(infoRows(page)).toHaveText([
      `Name: ${variable.display}`,
      `Description: ${variable.description}`,
      `Accession: ${variable.name}`,
      `Type: ${variable.type}`,
    ]);

    // And its own meta bag below them, which this component is the only renderer of
    const variableInfo = page.getByTestId('variable-info');
    await expect(variableInfo).toContainText(`values: ${variable.meta.values.join(', ')}`);
    await expect(variableInfo).not.toContainText('Unit:');
    await expect(variableInfo).not.toContainText('Subject Type:');
    await expect(variableInfo).not.toContainText('Vocabulary:');
    await expect(variableInfo).not.toContainText('Harmonization method(s):');
  });

  /**
   * The three section headings are `h2` for the outline - the page's own heading is an `h1`
   * and nothing sits between them - and must not render larger than it. An `h2` with no size
   * class is 1.75rem against this page's `h1.h4` at 1.25rem, so the level change needs the
   * `h5` the page's other section headings already use.
   *
   * Read from computed style rather than from class names, so it holds whatever the classes
   * say, and anchored on a visible heading first: a font size read off a page that has not
   * rendered is not a measurement.
   */
  test('renders the section headings at the size of the page, not larger than its h1', async ({
    page,
  }) => {
    // Given
    await page.goto(exploreUrl);
    await userIsLoggedIn(page);
    await expect(page.getByTestId('variable-info')).toBeVisible();

    // When
    const measure = (locator: Locator) =>
      locator.evaluate((element) => ({
        level: element.tagName,
        fontSize: parseFloat(getComputedStyle(element).fontSize),
      }));
    const pageHeading = await measure(page.getByTestId('variable-detail-name'));
    const sibling = await measure(
      page.getByTestId('variable-detail-hierarchy').getByRole('heading'),
    );
    // By role, not by `h2`: located as `h2` a level regression is a locator that never
    // resolves, so it fails as a 30s timeout and `level` below can never fail on its own.
    const sections = ['variable-info', 'dataset-info', 'study-info'];
    const headings = await Promise.all(
      sections.map((testid) => measure(page.getByTestId(testid).getByRole('heading'))),
    );

    // Then
    expect(pageHeading.level).toBe('H1');
    expect(sibling.level).toBe('H2');
    expect(headings).toHaveLength(3);
    headings.forEach((heading) => {
      // The level, which is what makes the outline h1 -> h2 with nothing skipped.
      expect(heading.level).toBe('H2');
      // And the size, which the level does not carry.
      expect(heading.fontSize).toBeLessThanOrEqual(pageHeading.fontSize);
      expect(heading.fontSize).toBeCloseTo(sibling.fontSize, 1);
    });
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

    // When the user opens a variable and comes back
    await navigateInApp(page, exploreUrl);
    await expect(identity(page)).toBeVisible();
    await expect(backButton(page)).toHaveAttribute('href', '/explorer');
    await backButton(page).click();

    // Then
    await expect(page).toHaveURL(/\/explorer$/);

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
    await navigateInApp(page, discoverUrl);
    await expect(identity(page)).toBeVisible();
    await backButton(page).click();
    await expect(page).toHaveURL(/\/discover$/);

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
  // Scoped: `data-testid="add-filter"` is AddFilter's button *and* HierarchyComponent's, and
  // both render on this page, so an unscoped locator resolves to two elements.
  const addFilterButton = (page: Page) => filterSection(page).getByTestId('add-filter');

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
    await expect(page.getByTestId('filter-component')).toBeVisible();
    await expect(page.getByTestId('variable-detail-export-toggle')).toHaveCount(0);
    await expect(page.getByTestId('variable-detail-filter-disabled')).toHaveCount(0);
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
    await expect(page.getByTestId('filter-component')).toHaveCount(0);
  });
});

import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiFail, mockApiConfig } from '../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  detailResponseCatSameDataset,
  facetResultPath,
  facetsResponse,
  searchResults as mockData,
  searchResultPath,
  facetResponseWithZeroCount,
  hierarchyResponse,
} from '../mock-data';
import { type SearchResult } from '../../../src/lib/models/Search';
import {
  getOption,
  mockConceptDetailFromRows,
  openNthResult,
  openNthResultFilter,
  optionsHaveLoaded,
  searchResultCards as resultCards,
  userIsLoggedIn,
  userIsLoggedOut,
} from '../utils';

/**
 * Categorical details whose first option identifies which response served them.
 *
 * Every stock detail response begins "Yes", so the cache specs below - which tell one
 * response from another by the first option alone - could not fail against them.
 */
/** The detail page's filter panel - where a result's filter interface lives once opened. */
const filterPanel = (page: Page) => page.getByTestId('variable-filter-panel');

const heartAttackDetail = { ...detailResponseCat, values: ['heart-attack-first', 'No'] };
const diedDetail = { ...detailResponseCatSameDataset, values: ['died-first', 'No'] };
const uncachedDetail = { ...detailResponseCat2, values: ['should-not-be-fetched', 'No'] };

test.describe('Explorer for authenticated users', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
      ],
    });
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetsResponse }),
    );
  });

  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Has filters, and searchbar when a search is from the landing page', async ({ page }) => {
    // Given
    await page.goto('/');
    await page.getByTestId('search-box').fill('somedata');
    await page.locator('#search-button').click();

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Has filters, and searchbar when a search is from the url', async ({ page }) => {
    // Given
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Facets with zero count are hidden', async ({ page }) => {
    await page.route(facetResultPath, async (route: Route) =>
      route.fulfill({ json: facetResponseWithZeroCount }),
    );
    // Given
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#facet-side-bar')).toBeVisible();
    await expect(
      page
        .getByTestId('accordion-item')
        .first()
        .getByTestId(`facet-${facetResponseWithZeroCount[0].name}-label`),
    ).not.toBeVisible();
  });
  test('Can search with empty search bar', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#search-button')).not.toBeDisabled();
  });
  test('Has search result cards when search is executed', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/hpds/auth/v3/query/sync', async (route: Route) =>
      route.fulfill({ body: '9999' }),
    );
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await page.getByTestId('search-box').fill('somedata');
    await page.locator('#search-button').click();

    // Then
    await expect(resultCards(page).first()).toBeVisible();
  });
  test('Scrolls to the top of the search results only when changing pages', async ({ page }) => {
    const pageOneResults = {
      ...mockData,
      totalPages: 2,
      totalElements: 200,
      numberOfElements: 100,
      number: 0,
      first: true,
      last: false,
      size: 100,
      pageable: {
        ...mockData.pageable,
        pageSize: 100,
      },
      content: Array.from({ length: 100 }, (_, index) => ({
        ...mockData.content[index % mockData.content.length],
        conceptPath: `\\test\\page-one-result-${index}\\`,
        name: `page-one-result-${index}`,
        // A card shows the display name, not the accession, and shows it unparenthesised
        // when there is no description - which is what makes the page identifiable below.
        display: `page-one-result-${index}`,
        description: null,
      })),
    };
    const pageTwoResults = {
      ...pageOneResults,
      number: 1,
      first: false,
      last: true,
      pageable: {
        ...pageOneResults.pageable,
        pageNumber: 1,
        offset: 100,
      },
      content: Array.from({ length: 100 }, (_, index) => ({
        ...mockData.content[index % mockData.content.length],
        conceptPath: `\\test\\page-two-result-${index}\\`,
        name: `page-two-result-${index}`,
        display: `page-two-result-${index}`,
        description: null,
      })),
    };
    await page.route(
      searchResultPath.replace('page_size=10', 'page_size=100'),
      async (route: Route) => route.fulfill({ json: pageOneResults }),
    );
    await page.route(
      searchResultPath.replace('page_number=0&page_size=10', 'page_number=1&page_size=100'),
      async (route: Route) => route.fulfill({ json: pageTwoResults }),
    );
    await page.goto('/explorer?search=sex');
    await userIsLoggedIn(page);

    await page.getByLabel('Rows per page').selectOption('100');
    await expect(resultCards(page)).toHaveCount(100);
    const scrollContainer = page.locator('#page');
    await scrollContainer.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    expect(await scrollContainer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    await page.getByLabel('Next', { exact: true }).click();
    await expect(page.getByLabel('Page 2')).toHaveAttribute('aria-current', 'page');
    await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
      'page-two-result-0',
    );
    await expect
      .poll(() =>
        page.locator('#search-results').evaluate((list) => {
          const container = document.querySelector('#page');
          return Math.abs(
            list.getBoundingClientRect().top - (container?.getBoundingClientRect().top ?? 0),
          );
        }),
      )
      .toBeLessThan(2);

    const currentPageButton = page.getByLabel('Page 2');
    await currentPageButton.scrollIntoViewIfNeeded();
    const currentPageScroll = await currentPageButton.evaluate((button) => {
      const container = document.querySelector('#page');
      if (!container) throw new Error('Page scroll container not found');

      const before = container.scrollTop;
      (button as HTMLButtonElement).click();
      return { before, after: container.scrollTop };
    });
    expect(currentPageScroll.before).toBeGreaterThan(0);
    expect(currentPageScroll.after).toBe(currentPageScroll.before);
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await mockApiFail(page, searchResultPath, 'accessdenied');
    await page.goto('/explorer?search=somedata');
    await userIsLoggedIn(page);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test.describe('Search result cards', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('*/**/picsure/hpds/auth/v3/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
    });

    test('Renders one card per result, and no table', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then
      await expect(resultCards(page)).toHaveCount(mockData.content.length);
      await expect(page.locator('table')).toHaveCount(0);
      await expect(page.locator('#ExplorerTable-table')).toHaveCount(0);
    });

    test('Leads with the description in bold and puts the variable name in parentheses', async ({
      page,
    }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then
      const card = resultCards(page).first();
      const description = card.getByTestId('search-result-card-description');
      await expect(description).toHaveText(mockData.content[0].description);
      // The emphasis is the point of the rule: the description carries it, the name does not.
      expect(await description.evaluate((element) => element.tagName)).toBe('STRONG');
      const name = card.getByTestId('search-result-card-name');
      await expect(name).toHaveText(`(${mockData.content[0].display})`);
      expect(await name.evaluate((element) => element.tagName)).not.toBe('STRONG');
    });

    test('Shows the bold name alone, with no parentheses, for a variable with no description', async ({
      page,
    }) => {
      // Given - no stock row is missing a description, so serve one that is
      await page.route(searchResultPath, async (route: Route) =>
        route.fulfill({
          json: {
            ...mockData,
            content: [{ ...mockData.content[0], description: null }],
          },
        }),
      );
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then
      const card = resultCards(page).first();
      await expect(card.getByTestId('search-result-card-description')).toHaveCount(0);
      const name = card.getByTestId('search-result-card-name');
      await expect(name).toHaveText(mockData.content[0].display);
      expect(await name.evaluate((element) => element.tagName)).toBe('STRONG');
      expect(await card.textContent()).not.toContain('(');
    });

    test('Shows the study acronym, falling back to the dataset when there is none', async ({
      page,
    }) => {
      // Given - row 0 has an acronym, the routed row below has none
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then
      await expect(resultCards(page).first().getByTestId('search-result-card-study')).toHaveText(
        mockData.content[0].studyAcronym,
      );

      // When
      await page.route(searchResultPath, async (route: Route) =>
        route.fulfill({
          json: { ...mockData, content: [{ ...mockData.content[0], studyAcronym: '' }] },
        }),
      );
      await page.reload();
      await userIsLoggedIn(page);

      // Then
      await expect(resultCards(page).first().getByTestId('search-result-card-study')).toHaveText(
        mockData.content[0].dataset,
      );
    });

    test('Badges the variable type, once', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then - one badge per card, and it reads the dictionary's type
      for (const [index, row] of mockData.content.entries()) {
        const badges = resultCards(page).nth(index).getByTestId('search-result-card-type');
        // The mockups show a "Harmonized Variable" badge beside the type; no dictionary field
        // backs it, so there is exactly one badge until one does.
        await expect(badges).toHaveCount(1);
        await expect(badges).toHaveText(row.type);
      }
    });

    test('Highlights on hover and shows a pointer cursor', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      const card = resultCards(page).first();
      await expect(card).toBeVisible();

      // Then
      expect(await card.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
      const resting = await card.evaluate((element) => getComputedStyle(element).backgroundColor);

      // When
      await card.hover();

      // Then
      await expect
        .poll(() => card.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(resting);
    });

    test('Is a link the browser can follow on its own, carrying the search term', async ({
      page,
    }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then - the encoded shape is asserted from the outside, so a change to the URL builder
      // that breaks a copied or bookmarked link fails here
      const row = mockData.content[0];
      await expect(resultCards(page).first()).toHaveAttribute(
        'href',
        `/explorer/variable/${encodeURIComponent(row.dataset)}/${encodeURIComponent(
          row.conceptPath,
        )}?search=somedata`,
      );
    });

    test('Says so, rather than linking, when the detail route will not accept the dataset', async ({
      page,
    }) => {
      // Given a dataset outside the detail route's allow-list. That list is a security
      // control - an unvalidated dataset once let a crafted link redirect an authenticated
      // POST - and the dataset is dictionary text, derived from a concept path's first
      // segment, so a study named like this is not hypothetical.
      await page.route(searchResultPath, async (route: Route) =>
        route.fulfill({
          json: {
            ...mockData,
            content: [{ ...mockData.content[0], dataset: 'BioLINCC (phs004266)' }],
          },
        }),
      );
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // Then the result is still shown, but there is no link to follow
      const card = resultCards(page).first();
      await expect(card).toBeVisible();
      await expect(card.getByTestId('search-result-card-description')).toHaveText(
        mockData.content[0].description,
      );
      await expect(card).not.toHaveAttribute('href');
      await expect(card.getByTestId('search-result-card-unopenable')).toContainText(
        'This variable cannot be opened',
      );

      // And clicking it goes nowhere, rather than onto "We could not read that variable link"
      await card.click();
      await expect(page).toHaveURL(/\/explorer\?search=somedata$/);
      await expect(page.getByTestId('variable-detail')).toHaveCount(0);
    });

    test('Says nothing about filtering: Explore is not open access', async ({ page }) => {
      // Given a fixture that does hold an unfilterable variable, so this is the section
      // deciding and not the data - row 6 is the one Discover marks.
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page)).toHaveCount(mockData.content.length);
      expect(mockData.content.some((row) => row.allowFiltering === false)).toBe(true);

      // Then - no card claims the state, in either direction
      await expect(page.locator('[data-testid="search-result-card"][data-filterable]')).toHaveCount(
        0,
      );
      await expect(page.getByTestId('search-result-card-filtering-unavailable')).toHaveCount(0);
    });

    test('Carries none of the row actions the detail page took over', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page).first()).toBeVisible();

      // Then - the card is a single click target; nothing inside it competes for the click
      await expect(resultCards(page).first().locator('button')).toHaveCount(0);
      for (const title of [
        'Information (i)',
        'Filter (f)',
        'Data Hierarchy (h)',
        'Add for Analysis (e)',
      ]) {
        await expect(page.getByTitle(title)).toHaveCount(0);
      }
    });
  });

  /*
   * The table this replaced focused the first row of a new page after a keyboard page change.
   * Cards are links, so they are tabbable without any help - but nothing moves focus when the
   * page turns, and a keyboard user who pages is otherwise dropped back at the top of the
   * document to tab down through the whole page again.
   */
  test.describe('Keyboard use of the card list', () => {
    const PAGE_SIZE = 10;
    /*
     * Three, not two. Next disables itself on the last page, and a browser blurs a control it
     * has just disabled - so a two-page fixture cannot tell "the mouse left focus alone" from
     * "focus was taken away", and the mouse case below would be asserting the browser's
     * behaviour rather than this component's.
     */
    const PAGE_COUNT = 3;
    const PAGE_LABELS = ['page-one-result', 'page-two-result', 'page-three-result'];

    /**
     * Three pages of results, each card identifiable by the page it came from.
     *
     * `pageTwoFirstRow` overrides the first result of page two, which is how a spec puts a
     * card that cannot be opened where the page change is about to put focus.
     */
    const pagedResults = async (page: Page, pageTwoFirstRow: Partial<SearchResult> = {}) => {
      const makePage = (pageNumber: number) => ({
        ...mockData,
        totalPages: PAGE_COUNT,
        totalElements: PAGE_SIZE * PAGE_COUNT,
        numberOfElements: PAGE_SIZE,
        number: pageNumber,
        first: pageNumber === 0,
        last: pageNumber === PAGE_COUNT - 1,
        pageable: { ...mockData.pageable, pageNumber, offset: pageNumber * PAGE_SIZE },
        content: Array.from({ length: PAGE_SIZE }, (_, index) => ({
          ...mockData.content[index % mockData.content.length],
          conceptPath: `\\test\\${PAGE_LABELS[pageNumber]}-${index}\\`,
          name: `${PAGE_LABELS[pageNumber]}-${index}`,
          // No description, so a card's name is the display name and nothing else.
          display: `${PAGE_LABELS[pageNumber]}-${index}`,
          description: null,
          allowFiltering: true,
          ...(pageNumber === 1 && index === 0 ? pageTwoFirstRow : {}),
        })),
      });
      for (let pageNumber = 0; pageNumber < PAGE_COUNT; pageNumber++) {
        await page.route(
          searchResultPath.replace('page_number=0', `page_number=${pageNumber}`),
          async (route: Route) => route.fulfill({ json: makePage(pageNumber) }),
        );
      }
    };

    test.beforeEach(async ({ page }) => {
      await page.route('*/**/picsure/hpds/auth/v3/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      await mockConceptDetailFromRows(page);
    });

    /*
     * WebKit does not put links in the tab order at all: measured directly against a bare
     * document, Tab from one anchor jumps straight past the following anchors to the first
     * <input>. That is Safari's "press Tab to highlight each item" preference, which is off by
     * default on macOS and which Playwright does not set - a platform convention about links,
     * not something this list decides. The two specs below are about Tab itself, so on WebKit
     * there is nothing left of them to assert.
     */
    const TAB_SKIPS_LINKS = 'WebKit does not tab to links (Safari full-keyboard-access is off)';

    test('Tab reaches each card once, in the order they were served', async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === 'webkit', TAB_SKIPS_LINKS);
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page)).toHaveCount(mockData.content.length);

      // When - starting on the first card, walk the list with Tab alone
      await resultCards(page).first().focus();

      // Then - one stop per card, in order, with nothing in between
      for (let index = 1; index < mockData.content.length; index++) {
        await page.keyboard.press('Tab');
        await expect(resultCards(page).nth(index)).toBeFocused();
      }
    });

    test('Does not make a card that cannot be opened a tab stop', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', TAB_SKIPS_LINKS);
      // Given a list whose second result has a dataset the detail route refuses
      await page.route(searchResultPath, async (route: Route) =>
        route.fulfill({
          json: {
            ...mockData,
            content: [
              mockData.content[0],
              { ...mockData.content[1], dataset: 'BioLINCC (phs004266)' },
              mockData.content[2],
            ],
          },
        }),
      );
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page)).toHaveCount(3);
      await expect(resultCards(page).nth(1)).toHaveAttribute('data-unopenable', 'true');

      // When - tabbing on from the first card
      await resultCards(page).first().focus();
      await page.keyboard.press('Tab');

      // Then - it is passed over: there is nothing on it to activate, and it only takes focus
      // when a page change puts it there
      await expect(resultCards(page).nth(2)).toBeFocused();
      await expect(resultCards(page).nth(1)).not.toBeFocused();
    });

    test('Paging from the keyboard lands focus on the first card of the new page', async ({
      page,
    }) => {
      // Given
      await pagedResults(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-one-result-0',
      );

      // When - Next reached and activated from the keyboard, as a keyboard user reaches it
      const next = page.getByLabel('Next', { exact: true });
      await next.focus();
      await page.keyboard.press('Enter');

      // Then - the new page is on screen, and focus is on the first card of it
      await expect(page.getByLabel('Page 2')).toHaveAttribute('aria-current', 'page');
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-two-result-0',
      );
      await expect(resultCards(page).first()).toBeFocused();
    });

    test('Lands on a first card that cannot be opened, rather than nowhere', async ({ page }) => {
      // Given page two whose first result has a dataset the detail route refuses. That card
      // renders unlinked, so it is not natively focusable - and a real browser will not focus
      // an element that has not been made focusable, where happy-dom obliges either way.
      await pagedResults(page, { dataset: 'BioLINCC (phs004266)' });
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-one-result-0',
      );

      // When
      await page.getByLabel('Next', { exact: true }).focus();
      await page.keyboard.press('Enter');

      // Then - the card focus landed on is the unopenable one, not the next link past it
      await expect(page.getByLabel('Page 2')).toHaveAttribute('aria-current', 'page');
      const first = resultCards(page).first();
      await expect(first).toHaveAttribute('data-unopenable', 'true');
      await expect(first).toBeFocused();
    });

    test('Paging by assistive technology moves focus, as the keyboard does', async ({ page }) => {
      // VoiceOver's AXPress, switch control and voice control dispatch a click with no key
      // event before it. They present as `MouseEvent.detail === 0`, like the keyboard, and
      // want the same thing - so this is the case a keydown-based split would have missed,
      // handing the mouse's behaviour to the users the feature is most for.
      await pagedResults(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-one-result-0',
      );

      // When - no key event, only the synthesised activation
      const next = page.getByLabel('Next', { exact: true });
      await next.focus();
      await next.evaluate((button) => (button as HTMLButtonElement).click());

      // Then
      await expect(page.getByLabel('Page 2')).toHaveAttribute('aria-current', 'page');
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-two-result-0',
      );
      await expect(resultCards(page).first()).toBeFocused();
    });

    test('A page change answered with nothing keeps focus on the page', async ({ page }) => {
      // The zero-*total* case, which is not the same as an empty page: the pagination is
      // gated on the handler having pages at all, so this response unrenders the very button
      // the activation came from. Focus has nowhere to stay and would fall to the body.
      await pagedResults(page);
      await page.route(
        searchResultPath.replace('page_number=0', 'page_number=1'),
        async (route: Route) =>
          route.fulfill({
            json: {
              ...mockData,
              totalPages: 0,
              totalElements: 0,
              numberOfElements: 0,
              number: 1,
              first: false,
              last: true,
              content: [],
            },
          }),
      );
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-one-result-0',
      );

      // When
      await page.getByLabel('Next', { exact: true }).focus();
      await page.keyboard.press('Enter');

      // Then - the button the user activated from is gone, and focus is on the message that
      // replaced the results rather than on the document body
      await expect(page.getByTestId('search-results-empty')).toBeVisible();
      await expect(page.getByLabel('Next', { exact: true })).toHaveCount(0);
      await expect(page.getByTestId('search-results-empty')).toBeFocused();
    });

    test('Paging with the mouse does not take focus off what the user was on', async ({
      page,
      browserName,
    }) => {
      // Given
      await pagedResults(page);
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-one-result-0',
      );

      // When - the same button, pressed rather than typed at
      const next = page.getByLabel('Next', { exact: true });
      await next.focus();
      await next.click();

      // Then - the page turned, and focus stayed where the user left it. Asserted after the
      // new page is on screen: before it, this passes on a list that never paged.
      await expect(page.getByLabel('Page 2')).toHaveAttribute('aria-current', 'page');
      await expect(resultCards(page).first().getByTestId('search-result-card-name')).toHaveText(
        'page-two-result-0',
      );
      // The portable half, and the one this ticket is about: the list did not pull focus into
      // itself. True on every engine.
      await expect(resultCards(page).first()).not.toBeFocused();
      // Where the platform keeps focus on a clicked button, it is still there. WebKit blurs it
      // to the body instead - measured against a bare document, so it is macOS convention
      // rather than anything this list did, and there is no button left to be focused.
      if (browserName !== 'webkit') await expect(next).toBeFocused();
    });
  });

  test.describe('Opening a search result', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('*/**/picsure/hpds/auth/v3/query/sync', async (route: Route) =>
        route.fulfill({ body: '9999' }),
      );
      // A card's detail page loads the concept before it renders anything, so detail has to
      // be available for whichever row a spec opens - not only the ones it asserts values on.
      await mockConceptDetailFromRows(page);
    });

    test('Clicking a card opens that variable detail page', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);

      // When
      await openNthResult(page, 0);

      // Then
      await expect(page).toHaveURL(
        `/explorer/variable/${encodeURIComponent(
          mockData.content[0].dataset,
        )}/${encodeURIComponent(mockData.content[0].conceptPath)}?search=somedata`,
      );
      await expect(page.getByTestId('variable-detail-name')).toHaveText(
        mockData.content[0].display,
      );
    });

    test('Opening a later card opens that variable, not the first', async ({ page }) => {
      // Given - index 0 would pass for any wiring at all, so open one that is not the default
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      const row = mockData.content[4];

      // When
      await openNthResult(page, 4);

      // Then
      await expect(page.getByTestId('variable-detail-name')).toHaveText(row.display);
      await expect(page.getByTestId('variable-detail-study')).toHaveText(row.studyAcronym);
      await expect(page).toHaveURL(
        `/explorer/variable/${encodeURIComponent(row.dataset)}/${encodeURIComponent(
          row.conceptPath,
        )}?search=somedata`,
      );
    });

    test('Opens the focused card with Enter', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      await userIsLoggedIn(page);
      const card = resultCards(page).nth(1);
      await expect(card).toBeVisible();

      // When
      await card.focus();
      await page.keyboard.press('Enter');

      // Then
      await expect(page.getByTestId('variable-detail-name')).toHaveText(
        mockData.content[1].display,
      );
    });

    test.describe('Variable information', () => {
      test('The information panel shows the opened variable', async ({ page }) => {
        // Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: detailResponseCat }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await openNthResult(page, 0);

        // Then
        const variableInfo = page.getByTestId('variable-info');
        await expect(variableInfo).toBeVisible();
        // Check Variable Information: the designed rows the mockups show, in their order,
        // then the concept's own meta bag. `detailResponseCat`'s bag carries none of the keys
        // Subject Type, Vocabulary and Harmonization method(s) come from, so those rows are
        // absent rather than empty; Accession falls back to `name`, which is a column of its
        // own and is the dbGaP variable accession on the dictionary's own dbGaP rows.
        await expect(variableInfo.getByText('Variable Information')).toBeVisible();
        await expect(variableInfo.locator('[data-testid^="variable-info-"]')).toHaveText([
          'Name: ' + detailResponseCat.display,
          'Description: ' + detailResponseCat.description,
          'Accession: ' + detailResponseCat.name,
          'Type: ' + detailResponseCat.type,
        ]);
        await expect(variableInfo).toContainText(
          'values: ' + detailResponseCat.meta.values.join(', '),
        );
        await expect(variableInfo).not.toContainText('Subject Type:');
        await expect(variableInfo).not.toContainText('Vocabulary:');

        // Check Dataset Information
        const datasetInfo = page.getByTestId('dataset-info');
        await expect(datasetInfo.getByText('Dataset Information')).toBeVisible();
        await expect(datasetInfo).toContainText('Name: ' + detailResponseCat.table.display);
        await expect(datasetInfo).toContainText('Accession: ' + detailResponseCat.table.name);
        await expect(datasetInfo).toContainText(
          'Description: ' + detailResponseCat.table.description,
        );

        // Check Study Information
        const studyInfo = page.getByTestId('study-info');
        await expect(studyInfo.getByText('Study Information')).toBeVisible();
        await expect(studyInfo).toContainText('Study Name: ' + detailResponseCat.study.fullName);
        await expect(studyInfo).toContainText('Study Accession: ' + detailResponseCat.study.ref);
      });
    });

    test.describe('Filter Actions', () => {
      test('Opens the categorical filter interface for a categorical variable', async ({
        page,
      }) => {
        // Given - row 0 is Categorical
        expect(mockData.content[0].type).toBe('Categorical');
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await openNthResultFilter(page, 0);

        // Then - the value list, which is what ticket 14's panel renders for a Categorical
        // variable. Not `categoical-filter`: that belongs to `AddFilter`, which this page no
        // longer uses, so asserting its absence would have held for any panel at all.
        await expect(filterPanel(page).getByTestId('optional-selection-list')).toHaveCount(1);
        await expect(filterPanel(page).getByTestId('optional-selection-list')).toBeVisible();
        await expect(filterPanel(page).getByTestId('numerical-filter')).toHaveCount(0);
      });
      test('Opens the numerical filter interface for a continuous variable', async ({ page }) => {
        // Given - row 3 is Continuous. The old spec opened row 2, which is Categorical, so its
        // "(numerical)" branch never ran.
        expect(mockData.content[3].type).toBe('Continuous');
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await openNthResultFilter(page, 3);

        // Then
        await expect(filterPanel(page).getByTestId('numerical-filter')).toBeVisible();
        await expect(filterPanel(page).getByTestId('optional-selection-list')).toHaveCount(0);
      });
      test('Searching in filter shows only searched options', async ({ page }) => {
        // Given
        const row = mockData.content[0] as SearchResult;
        const searchValue = 'No';

        await page.route(
          '*/**/picsure/dictionary/concepts/detail/' + row.dataset,
          async (route: Route) => route.fulfill({ body: JSON.stringify(row) }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await openNthResultFilter(page, 0);
        await optionsHaveLoaded(page);

        // When
        await page
          .getByTestId('optional-selection-list')
          .getByPlaceholder('Search...')
          .fill(searchValue);

        // Then
        const searchString = (value: string) =>
          value.toLowerCase().includes(searchValue.toLowerCase());
        const include = (row.values || []).filter(searchString);
        const exclude = (row.values || []).filter((value) => !searchString(value));
        const options = page.locator('#options-container');
        await Promise.all([
          ...include.map((value) =>
            expect(options.getByLabel(value, { exact: true })).toBeVisible(),
          ),
          ...exclude.map((value) =>
            expect(options.getByLabel(value, { exact: true })).not.toBeVisible(),
          ),
        ]);
      });
      test('Select all disabled when all options are added', async ({ page }) => {
        // Given
        const row = mockData.content[0] as SearchResult;

        await page.route(
          '*/**/picsure/dictionary/concepts/detail/' + row.dataset,
          async (route: Route) => route.fulfill({ body: JSON.stringify(row) }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await openNthResultFilter(page, 0);

        // When
        const searchBtn = page.locator('#select-all');
        await page.locator('#select-all').click();

        // Then
        await expect(page.locator('#options-container')).toBeEmpty();
        await expect(searchBtn).toBeDisabled();
      });
      test('The dictionary details are different for the same dataset', async ({ page }) => {
        // Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: heartAttackDetail }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await openNthResultFilter(page, 0);
        const firstItem = await getOption(page);

        // Then
        expect((await firstItem.textContent())?.trim()).toBe(heartAttackDetail.values[0]);

        // Then Given - a different concept under the same dataset gets its own answer
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: diedDetail }),
        );
        // When
        await openNthResultFilter(page, 1);

        const secondItem = await getOption(page);
        // Then
        expect((await secondItem.textContent())?.trim()).toBe(diedDetail.values[0]);
      });
      test('The dictionary details are cached', async ({ page }) => {
        // Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: heartAttackDetail }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await openNthResultFilter(page, 0);
        const firstItem = await getOption(page);

        // Then
        expect((await firstItem.textContent())?.trim()).toBe(heartAttackDetail.values[0]);

        // Then Given
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: diedDetail }),
        );
        // When
        await openNthResultFilter(page, 1);

        const secondItem = await getOption(page);
        // Then
        expect((await secondItem.textContent())?.trim()).toBe(diedDetail.values[0]);

        // Then Given - this must not be hit, so serve something whose first option differs
        // from the cached one. The stock responses all begin "Yes", which is why the old
        // version of this assertion could not fail.
        await page.route(
          `${conceptsDetailPath}/${detailResponseCat.dataset}`,
          async (route: Route) => route.fulfill({ json: uncachedDetail }),
        );

        // When
        await openNthResultFilter(page, 0);
        const sameItem = await getOption(page);
        // Then
        expect((await sameItem.textContent())?.trim()).toBe(heartAttackDetail.values[0]);
        expect((await sameItem.textContent())?.trim()).not.toBe(uncachedDetail.values[0]);
      });
    });
    test.describe('Export Actions', () => {
      const exportToggle = (page: Page) => page.getByTestId('variable-detail-export-toggle');

      test('Add for Analysis flips the icon on the detail page', async ({ page }) => {
        // Given
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await openNthResult(page, 0);

        // When
        const icon = exportToggle(page).locator('i');
        await expect(icon).toHaveClass(/fa-right-from-bracket/);

        // Then
        await exportToggle(page).click();
        await expect(icon).toHaveClass(/fa-square-check/);
        await exportToggle(page).click();
        await expect(icon).toHaveClass(/fa-right-from-bracket/);
      });
      test('Adding for analysis opens the result panel with the variable in it', async ({
        page,
      }) => {
        // Given
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await openNthResult(page, 0);

        // When
        await exportToggle(page).click();

        // Then
        await expect(page.locator('#results-panel')).toBeVisible();
        await expect(page.getByTestId('export-header')).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].conceptPath}`),
        ).toBeVisible();
      });
      test('Clicking an export remove button removes the export', async ({ page }) => {
        // Given
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await openNthResult(page, 0);
        await exportToggle(page).click();
        const added = page.getByTestId(`added-export-${mockData.content[0].conceptPath}`);
        await expect(added).toBeVisible();

        // When
        await added.locator('button').click();

        // Then
        await expect(page.getByTestId('export-header')).not.toBeVisible();
        await expect(added).toHaveCount(0);
      });
      test('Adding a second variable adds a second export', async ({ page }) => {
        // Given
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);

        // When
        await openNthResult(page, 0);
        await exportToggle(page).click();
        await openNthResult(page, 1);
        await exportToggle(page).click();

        // Then
        await expect(page.getByTestId('export-header')).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].conceptPath}`),
        ).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[1].conceptPath}`),
        ).toBeVisible();
      });
      test('Exports remain after closing and opening the results panel', async ({ page }) => {
        // Given
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        await openNthResult(page, 0);
        await exportToggle(page).click();
        await openNthResult(page, 1);
        await exportToggle(page).click();

        // When
        await page.locator('#results-panel-toggle').click();

        // Then
        await expect(page.locator('#results-panel')).not.toBeVisible();
        await page.locator('#results-panel-toggle').click();

        // Then
        await expect(page.locator('#results-panel')).toBeVisible();
        await expect(page.getByTestId('export-header')).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[0].conceptPath}`),
        ).toBeVisible();
        await expect(
          page.getByTestId(`added-export-${mockData.content[1].conceptPath}`),
        ).toBeVisible();
      });
    });
    test.describe('Hierarchy Actions', () => {
      test.beforeEach(async ({ page }) => {
        await page.route(
          '*/**/picsure/dictionary/concepts/hierarchy/test_data_set',
          async (route: Route) => route.fulfill({ json: hierarchyResponse }),
        );
        await page.goto('/explorer?search=somedata');
        await userIsLoggedIn(page);
        // The hierarchy is a section of the variable's own page now, not a row action.
        await openNthResult(page, 0);
        await expect(page.getByTestId('variable-detail-hierarchy')).toBeVisible();
      });
      test('Hierarchy component shows on the variable page', async ({ page }) => {
        // Then
        await expect(page.getByTestId('hierarchy-component')).toBeVisible();
      });
      test('Hierarchy component data is expected', async ({ page }) => {
        // Then
        await expect(page.getByTestId('hierarchy-component')).toBeVisible();
        const hierarchyComponent = page.getByTestId('hierarchy-component');
        const treeItems = await hierarchyComponent.locator('details').all();
        const conceptPathItems = hierarchyResponse.reverse();
        for (let i = 0; i < conceptPathItems.length; i++) {
          const treeItem = treeItems[i];
          const treeItemText = await treeItem.locator('> summary label').textContent();
          expect(treeItemText).toContain(conceptPathItems[i].display);
          expect(treeItemText).toContain(conceptPathItems[i].name);
        }
      });
      test("Hierarchy component's last item is the only one selected", async ({ page }) => {
        // Then
        const allRadioButtons = await page
          .locator('details')
          .locator('summary')
          .locator('input')
          .all();
        for (let i = 0; i < allRadioButtons.length - 1; i++) {
          if (i === allRadioButtons.length) {
            await expect(allRadioButtons[i]).toBeChecked();
          } else {
            await expect(allRadioButtons[i]).not.toBeChecked();
          }
        }
      });
      test("Hierarchy component's last radio buttons are selectable", async ({ page }) => {
        // Then
        const allRadioButtons = await page
          .locator('details')
          .locator('summary')
          .locator('input')
          .all();
        for (let i = 0; i < allRadioButtons.length; i++) {
          await allRadioButtons[i].click();
          await expect(allRadioButtons[i]).toBeChecked();
        }
      });
    });
  });
});

test.describe('Explorer for unauthenticated users', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test('Unauthenticated user can access explorer without being redirected to login', async ({
    page,
  }) => {
    // Given
    // OPEN + OPEN_EXPLORER together are what let an unauthenticated user reach
    // /explorer and use it directly, per "Explore Without Login" (see internal docs):
    // unauthenticated OPEN_EXPLORER users get full search/facets/filtering/genomic/
    // visualization access on this page, with no login gate.
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'true' },
      ],
    });
    await page.goto('/explorer');

    // Then
    await expect(page).toHaveURL('/explorer');
    await userIsLoggedOut(page);
    await expect(page.locator('#search-bar')).toBeVisible();
  });

  test('User is prompted to login if not authenticated and explorer is not open', async ({
    page,
  }) => {
    // Given
    // Without OPEN_EXPLORER, /explorer's own layout redirects unauthenticated
    // users to /login (see explorer/+layout.ts).
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
      ],
    });
    await page.goto('/explorer');

    // Then
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fexplorer/);
  });
});

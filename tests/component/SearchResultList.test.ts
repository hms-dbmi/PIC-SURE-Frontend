// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { TableHandler } from '@vincjo/datatables/server';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));
vi.mock('$lib/stores/User', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/User')>()),
  isUserLoggedIn: () => true,
}));

import SearchResultList from '$lib/components/explorer/SearchResultList.svelte';
import type { SearchResult } from '$lib/models/Search';

const ROWS_PER_PAGE = 5;
const TOTAL_ROWS = 10;

/**
 * A page of results, each identifiable by its display name.
 *
 * `description: null` on purpose: a card with a description leads with the description and
 * puts the name in parentheses, so leaving it out is what makes "Row 5" the text of the card
 * the assertions below read.
 */
function makeRows(start: number, count: number, overrides: Partial<SearchResult>[] = []) {
  return Array.from(
    { length: count },
    (_, index) =>
      ({
        conceptPath: `\\test\\row-${start + index}\\`,
        dataset: 'test_data_set',
        name: `row-${start + index}`,
        display: `Row ${start + index}`,
        studyAcronym: 'TDS',
        description: null,
        type: 'Categorical',
        allowFiltering: true,
        ...overrides[index],
      }) as SearchResult,
  );
}

/**
 * The list over a server-side handler, which is what `stores/Search` hands it.
 *
 * Server-side matters to what is under test: `setPage` moves `currentPage` at once but only
 * replaces `rows` when the fetch resolves, so the cards to focus do not exist yet at the
 * moment the page changes. Every load after the first is held open, and `settle()` answers it
 * - which is the only way to interleave anything (a facet change, more paging) with a request
 * that is still in flight.
 */
function renderList({ debounce = 0, totalRows = TOTAL_ROWS } = {}) {
  const handler = new TableHandler<SearchResult>([], { rowsPerPage: ROWS_PER_PAGE, debounce });
  let loads = 0;
  let answer: ((rows: SearchResult[]) => void) | undefined;
  handler.load(() => {
    loads += 1;
    if (loads === 1) {
      handler.totalRows = totalRows;
      return Promise.resolve(makeRows(0, ROWS_PER_PAGE));
    }
    return new Promise<SearchResult[]>((resolve) => {
      answer = resolve;
    });
  });
  handler.invalidate();

  const rendered = render(SearchResultList, {
    id: 'search-results',
    rowsPreferenceKey: 'ExplorerTable',
    handler,
    section: 'explorer' as const,
    isLoading: false,
    criteriaGeneration: 0,
  });

  return {
    handler,
    ...rendered,
    /**
     * Answers the load in flight the way the server would.
     *
     * Waits for the rows to *change identity* rather than to equal what was handed over: the
     * handler stores them in a rune, so what comes back out is a reactive proxy and never the
     * array that went in. The production code compares proxy to proxy, which is why its
     * `rows === rowsAtRequest` check still means what it says.
     */
    async settle(rows: SearchResult[] = makeRows(5, 5), total = totalRows) {
      await waitFor(() => expect(answer).toBeDefined());
      const resolve = answer!;
      const before = handler.rows;
      answer = undefined;
      handler.totalRows = total;
      resolve(rows);
      await waitFor(() => expect(handler.rows).not.toBe(before));
    },
    /** How many loads the handler has dispatched, so a test can prove two coalesced into one. */
    loadCount: () => loads,
  };
}

const cards = () => screen.queryAllByTestId('search-result-card');
const nextButton = () => screen.getByLabelText('Next');
const previousButton = () => screen.getByLabelText('Previous');
const announcer = () => screen.getByTestId('search-results-announcer');

/*
 * `Pagination` tells a pointer press from everything else by `MouseEvent.detail` - 1 for a
 * real click, 0 for Enter, Space and the synthesised clicks assistive technology dispatches.
 * So these two helpers are the whole difference between the two paths, and `detail` is spelled
 * out in both: `fireEvent.click` defaults to 0, which means a bare `fireEvent.click` here is a
 * *keyboard* activation, and a mouse case written without the argument would silently test the
 * wrong path.
 *
 * Because the number is hand-made here, this layer cannot prove that a real pointer press and
 * a real keypress carry those values. That is measured in three engines by the e2e specs
 * (`Paging from the keyboard…`, `Paging with the mouse…`, `Paging by assistive technology…`).
 */
const clickByKeyboard = (element: HTMLElement) => fireEvent.click(element, { detail: 0 });
const clickByMouse = (element: HTMLElement) => fireEvent.click(element, { detail: 1 });

async function onPageOne() {
  await waitFor(() => expect(cards()).toHaveLength(5));
  expect(cards()[0]).toHaveTextContent('Row 0');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the search result list', () => {
  it('puts each card in the tab order exactly once, in the order served', async () => {
    renderList();
    await onPageOne();

    // One focusable per card, and it is the card. The table this replaced put the row and
    // four action buttons in reach of the same result.
    const focusable = Array.from(
      screen.getByTestId('search-result-list').querySelectorAll('a[href], [tabindex]'),
    );
    expect(focusable).toEqual(cards());
    // In the order the server served them, by href rather than by position: a list that
    // rendered the right five cards in the wrong order would pass on count alone.
    expect(cards().map((card) => card.getAttribute('href'))).toEqual([
      '/explorer/variable/test_data_set/%5Ctest%5Crow-0%5C',
      '/explorer/variable/test_data_set/%5Ctest%5Crow-1%5C',
      '/explorer/variable/test_data_set/%5Ctest%5Crow-2%5C',
      '/explorer/variable/test_data_set/%5Ctest%5Crow-3%5C',
      '/explorer/variable/test_data_set/%5Ctest%5Crow-4%5C',
    ]);
  });

  describe('paging', () => {
    /*
     * Two ways to reach the same page change, wanting opposite things from focus. A keyboard
     * or assistive-technology user has just activated Next and has nothing under a cursor to
     * return to, so leaving focus on the button strands them above a list they have to tab
     * back down into; a mouse user's pointer is still where they left it, and moving focus
     * takes it from them.
     *
     * So each case asserts the page really turned *before* it asserts anything about focus.
     * Without that, the mouse case passes on a list that never changed page, and the keyboard
     * case can pass on focus that never moved.
     */

    it('moves focus to the first card of the new page when paged from the keyboard', async () => {
      const { handler, settle } = renderList();
      await onPageOne();

      const next = nextButton();
      next.focus();
      expect(document.activeElement).toBe(next);

      await clickByKeyboard(next);
      await settle();

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
      // Named, not just "some card": focus on the *first* card is the requirement, and a
      // list whose focus fell on the last one would satisfy identity alone.
      expect(document.activeElement).toHaveTextContent('Row 5');
    });

    it('moves focus for an activation that arrives as a bare synthesised click', async () => {
      // VoiceOver's AXPress, switch control and voice control all dispatch a click with no key
      // event before it. They want what the keyboard wants, and a keydown-based split would
      // hand them the mouse's behaviour - which is to say, skip the users the feature is for.
      const { handler, settle } = renderList();
      await onPageOne();

      const next = nextButton();
      next.focus();
      next.click();
      await settle();

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
    });

    it('leaves focus where it was when paged with the mouse', async () => {
      const { handler, settle } = renderList();
      await onPageOne();

      const next = nextButton();
      next.focus();

      await clickByMouse(next);
      await settle();

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      // The new page is on screen and focus did not follow it.
      expect(document.activeElement).toBe(next);
    });

    it('moves focus back to the first card when paged backwards from the keyboard', async () => {
      const { handler, settle } = renderList();
      await onPageOne();

      await clickByKeyboard(nextButton());
      await settle();
      await waitFor(() => expect(handler.currentPage).toBe(2));

      const previous = previousButton();
      previous.focus();
      await clickByKeyboard(previous);
      await settle(makeRows(0, 5));

      await waitFor(() => {
        expect(handler.currentPage).toBe(1);
        expect(cards()[0]).toHaveTextContent('Row 0');
      });
      // The first card, not the last: focus has to agree with the caller's scroll back to the
      // top of the list rather than drag the viewport to the bottom of it.
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
      expect(document.activeElement).toHaveTextContent('Row 0');
    });

    it('focuses a numbered page button the same way it focuses Next', async () => {
      const { handler, settle } = renderList();
      await onPageOne();

      const pageTwo = screen.getByLabelText('Page 2');
      pageTwo.focus();
      await clickByKeyboard(pageTwo);
      await settle();

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
    });

    it('lands on a first card that cannot be opened, rather than on the card past it', async () => {
      // `variableDetailHref` refuses a dataset the detail route would reject, so that card is
      // not a link. Whether the *browser* will focus it is pinned by the e2e suite; what this
      // covers is that the list still aims at the first card rather than skipping to the
      // first anchor.
      const { handler, settle } = renderList();
      await onPageOne();

      await clickByKeyboard(nextButton());
      await settle(makeRows(5, 5, [{ dataset: 'BioLINCC (phs004266)' }]));

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveAttribute('data-unopenable', 'true');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
      expect(document.activeElement?.tagName).not.toBe('A');
    });

    it('does not page, or move focus, past the last page', async () => {
      const { handler, settle } = renderList();
      await onPageOne();

      await clickByKeyboard(nextButton());
      await settle();
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));

      // Next is disabled on the last page, so the click never reaches the handler - but the
      // focus request must not be left armed either way.
      const last = cards()[4];
      last.focus();
      await clickByKeyboard(nextButton());

      expect(handler.currentPage).toBe(2);
      expect(document.activeElement).toBe(last);
    });
  });

  /*
   * A pending request names the question it asked, not just the page it was going to. The page
   * number is not an identity: a facet click and a new search both call `setPage(1)`, so their
   * rows arrive on the page a backwards page change was waiting for. Spending the request on
   * them takes focus off the control the user is working in - worse than the bug this whole
   * mechanism exists to fix.
   */
  describe('a request that something else superseded', () => {
    /** Leaves a keyboard request for page 1 in flight, made from page 2. */
    async function pendingBackwardsRequest() {
      const list = renderList();
      await onPageOne();
      await clickByKeyboard(nextButton());
      await list.settle();
      await waitFor(() => expect(list.handler.currentPage).toBe(2));

      const previous = previousButton();
      previous.focus();
      await clickByKeyboard(previous);
      return { ...list, previous };
    }

    it('drops it when the criteria moved while it was in flight', async () => {
      const { handler, settle, rerender, previous } = await pendingBackwardsRequest();

      // What a facet click or a new search does: bump the generation, and land on page 1 -
      // the very page the request was waiting for.
      await rerender({ criteriaGeneration: 1 });
      await settle(makeRows(100, 5));

      await waitFor(() => expect(cards()[0]).toHaveTextContent('Row 100'));
      expect(handler.currentPage).toBe(1);
      // Focus stayed on the control the user was using, not on results they never asked for.
      expect(document.activeElement).toBe(previous);
    });

    it('drops it when rows-per-page moved while it was in flight', async () => {
      // Not a criteria change, so the generation does not catch this one - `setRowsPerPage`
      // also lands on page 1, which is where the request was going.
      const { handler, settle, previous } = await pendingBackwardsRequest();

      handler.setRowsPerPage(10);
      await settle(makeRows(200, 10));

      await waitFor(() => expect(cards()[0]).toHaveTextContent('Row 200'));
      expect(handler.currentPage).toBe(1);
      expect(document.activeElement).toBe(previous);
    });

    it('drops it when the user went on paging with the mouse', async () => {
      // Two page changes inside one debounce window, so they coalesce into a single load the
      // way they do in the app - which is what keeps the stale request alive long enough to be
      // spent. The mouse leaves the user back on page 1, exactly where the request was aimed.
      const { handler, settle, loadCount } = renderList({ debounce: 50 });
      await onPageOne();
      await clickByKeyboard(nextButton());
      await settle();
      await waitFor(() => expect(handler.currentPage).toBe(2));

      const previous = previousButton();
      previous.focus();
      await clickByKeyboard(previous);
      const loadsBefore = loadCount();

      await clickByMouse(nextButton());
      await clickByMouse(previousButton());
      expect(handler.currentPage).toBe(1);

      await settle(makeRows(300, 5));
      // One load answered all three page changes; had they not coalesced, an arrival on page 2
      // would have dropped the request for reasons that have nothing to do with the mouse.
      expect(loadCount()).toBe(loadsBefore + 1);

      await waitFor(() => expect(cards()[0]).toHaveTextContent('Row 300'));
      expect(document.activeElement).toBe(previous);
    });
  });

  /*
   * Focus landing on the first card announces *that card*. It does not say the page turned, or
   * which page of how many this now is - so a screen reader user who pages hears a variable
   * name and cannot tell whether they moved one page or five. `RemoteTable` announced it.
   */
  describe('what a screen reader is told', () => {
    it('announces the new page number and the total', async () => {
      const { settle } = renderList();
      await onPageOne();

      expect(announcer()).toHaveAttribute('aria-live', 'polite');

      await clickByKeyboard(nextButton());
      await settle();

      await waitFor(() => expect(announcer()).toHaveTextContent('Page 2 of 2'));
    });

    it('says nothing when the mouse paged, which announces itself by the cursor', async () => {
      const { settle } = renderList();
      await onPageOne();

      await clickByMouse(nextButton());
      await settle();
      await waitFor(() => expect(cards()[0]).toHaveTextContent('Row 5'));

      // Long enough for the announcement's own 30ms delay to have elapsed had one been made.
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(announcer()).toHaveTextContent('');
    });
  });

  /*
   * A page change answered with nothing at all. The pagination is gated on the handler having
   * pages, so a zero-total response unrenders the very button the user activated - focus would
   * fall to the body, which is the failure this ticket exists to remove.
   */
  describe('a page change answered with no results', () => {
    it('puts focus on the message rather than dropping it to the body', async () => {
      const { settle } = renderList();
      await onPageOne();

      await clickByKeyboard(nextButton());
      await settle([], 0);

      await waitFor(() => expect(screen.getByTestId('search-results-empty')).toBeInTheDocument());
      await waitFor(() =>
        expect(document.activeElement).toBe(screen.getByTestId('search-results-empty')),
      );
      expect(document.activeElement).not.toBe(document.body);
    });

    it('says so, rather than announcing a page that is not there', async () => {
      const { settle } = renderList();
      await onPageOne();

      await clickByKeyboard(nextButton());
      await settle([], 0);

      await waitFor(() => expect(announcer()).toHaveTextContent('No entries found.'));
    });
  });
});

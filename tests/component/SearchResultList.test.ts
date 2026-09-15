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
 * moment the page changes.
 */
function renderList(pageTwo = makeRows(5, 5)) {
  const handler = new TableHandler<SearchResult>([], { rowsPerPage: ROWS_PER_PAGE, debounce: 0 });
  handler.load((state) => {
    handler.totalRows = TOTAL_ROWS;
    return Promise.resolve(state.currentPage === 1 ? makeRows(0, 5) : pageTwo);
  });
  handler.invalidate();

  const rendered = render(SearchResultList, {
    id: 'search-results',
    rowsPreferenceKey: 'ExplorerTable',
    handler,
    section: 'explorer' as const,
    isLoading: false,
  });
  return { handler, ...rendered };
}

const cards = () => screen.queryAllByTestId('search-result-card');
const nextButton = () => screen.getByLabelText('Next');

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
     * user has just activated Next and has nothing under a cursor to return to, so leaving
     * focus on the button strands them above a list they have to tab back down into; a mouse
     * user's pointer is still where they left it, and moving focus takes it from them.
     *
     * So each case asserts the page really turned *before* it asserts anything about focus.
     * Without that, the mouse case passes on a list that never changed page, and the keyboard
     * case can pass on focus that never moved.
     */

    it('moves focus to the first card of the new page when paged from the keyboard', async () => {
      const { handler } = renderList();
      await onPageOne();

      const next = nextButton();
      next.focus();
      expect(document.activeElement).toBe(next);

      await fireEvent.keyDown(next, { key: 'Enter' });

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
      // Named, not just "some card": focus on the *first* card is the requirement, and a
      // list whose focus fell on the last one would satisfy identity alone.
      expect(document.activeElement).toHaveTextContent('Row 5');
    });

    it('leaves focus where it was when paged with the mouse', async () => {
      const { handler } = renderList();
      await onPageOne();

      const next = nextButton();
      next.focus();

      await fireEvent.click(next);

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      // The new page is on screen and focus did not follow it.
      expect(document.activeElement).toBe(next);
    });

    it('moves focus back to the first card when paged backwards from the keyboard', async () => {
      const { handler } = renderList();
      await onPageOne();

      await fireEvent.keyDown(nextButton(), { key: 'Enter' });
      await waitFor(() => expect(handler.currentPage).toBe(2));

      const previous = screen.getByLabelText('Previous');
      previous.focus();
      await fireEvent.keyDown(previous, { key: ' ' });

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
      const { handler } = renderList();
      await onPageOne();

      const pageTwo = screen.getByLabelText('Page 2');
      pageTwo.focus();
      await fireEvent.keyDown(pageTwo, { key: 'Enter' });

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveTextContent('Row 5');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
    });

    it('lands on a first card that cannot be opened, rather than nowhere', async () => {
      // `variableDetailHref` refuses a dataset the detail route would reject, so that card is
      // not a link and is not natively focusable. Focus still has to go somewhere the user
      // can tab onwards from.
      const { handler } = renderList(makeRows(5, 5, [{ dataset: 'BioLINCC (phs004266)' }]));
      await onPageOne();

      await fireEvent.keyDown(nextButton(), { key: 'Enter' });

      await waitFor(() => {
        expect(handler.currentPage).toBe(2);
        expect(cards()[0]).toHaveAttribute('data-unopenable', 'true');
      });
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));
      expect(document.activeElement?.tagName).not.toBe('A');
    });

    it('does not page, or move focus, past the last page', async () => {
      const { handler } = renderList();
      await onPageOne();

      await fireEvent.keyDown(nextButton(), { key: 'Enter' });
      await waitFor(() => expect(handler.currentPage).toBe(2));
      await waitFor(() => expect(document.activeElement).toBe(cards()[0]));

      // Next is disabled on the last page, so the keydown never reaches the handler - but the
      // focus request must not be left armed either way.
      const last = cards()[4];
      last.focus();
      await fireEvent.keyDown(nextButton(), { key: 'Enter' });

      expect(handler.currentPage).toBe(2);
      expect(document.activeElement).toBe(last);
    });
  });
});

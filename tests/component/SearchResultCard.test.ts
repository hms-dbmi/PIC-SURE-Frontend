// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

// The card's only job beyond the field mapping is to produce the detail-page href, so `resolve`
// is the identity here and the assertions below are on the URL the builder made.
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

// Signed in by default, so an `explorer` card is the ordinary authenticated case. The other
// half of the open-access rule is `!isUserLoggedIn()`, which reads localStorage - left real,
// every Explore card here would be an open-access one and the section would prove nothing.
const mockState = vi.hoisted(() => ({ loggedIn: true }));
vi.mock('$lib/stores/User', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/User')>()),
  isUserLoggedIn: () => mockState.loggedIn,
}));

import SearchResultCard from '$lib/components/explorer/SearchResultCard.svelte';
import { createLog, log } from '$lib/logger';
import type { SearchResult } from '$lib/models/Search';

const result = {
  conceptPath: '\\this\\is\\a\\age\\',
  dataset: 'test_data_set',
  name: 'age1',
  display: 'Age at exam',
  studyAcronym: 'TDS',
  description: 'Age of the participant at the exam',
  type: 'Continuous',
  allowFiltering: true,
} as SearchResult;

function renderCard(overrides: Partial<SearchResult> = {}, props: Record<string, unknown> = {}) {
  return render(SearchResultCard, {
    result: { ...result, ...overrides } as SearchResult,
    section: 'explorer',
    ...props,
  });
}

const card = () => screen.getByTestId('search-result-card');

beforeEach(() => {
  mockState.loggedIn = true;
});

describe('the search result card', () => {
  it('leads with the description in bold and puts the variable name in parentheses', () => {
    renderCard();

    const description = screen.getByTestId('search-result-card-description');
    expect(description.tagName).toBe('STRONG');
    expect(description).toHaveTextContent('Age of the participant at the exam');

    const name = screen.getByTestId('search-result-card-name');
    expect(name).toHaveTextContent('(Age at exam)');
    // The name is the unemphasised half: bolding both would lose the distinction the design
    // draws between what the variable measures and what it is called.
    expect(name.tagName).not.toBe('STRONG');
  });

  it('shows the bold name alone, with no empty parentheses, when there is no description', () => {
    renderCard({ description: null });

    expect(screen.queryByTestId('search-result-card-description')).toBeNull();
    const name = screen.getByTestId('search-result-card-name');
    expect(name.tagName).toBe('STRONG');
    expect(name).toHaveTextContent('Age at exam');
    expect(card().textContent).not.toContain('(');
    expect(card().textContent).not.toContain(')');
  });

  it('treats a whitespace-only description as absent', () => {
    // A bold nothing followed by "(name)" is the shape the no-description branch exists to
    // avoid, so blank is not the same as present.
    renderCard({ description: '   \n ' });

    expect(screen.queryByTestId('search-result-card-description')).toBeNull();
    expect(screen.getByTestId('search-result-card-name')).toHaveTextContent('Age at exam');
    expect(card().textContent).not.toContain('(');
  });

  it('falls back from display to the accession for the variable name', () => {
    renderCard({ display: '', description: null });

    expect(screen.getByTestId('search-result-card-name')).toHaveTextContent('age1');
  });

  it('shows the study acronym, falling back to the dataset when there is none', () => {
    const { unmount } = renderCard();
    expect(screen.getByTestId('search-result-card-study')).toHaveTextContent('TDS');
    unmount();

    renderCard({ studyAcronym: '' });
    expect(screen.getByTestId('search-result-card-study')).toHaveTextContent('test_data_set');
  });

  it('badges the variable type', () => {
    for (const type of ['Categorical', 'Continuous', 'AnyRecordOf'] as const) {
      const { unmount } = renderCard({ type });
      expect(screen.getByTestId('search-result-card-type')).toHaveTextContent(type);
      unmount();
    }
  });

  it('carries one badge, not two: nothing on a row says a variable is harmonized', () => {
    renderCard();

    // The mockups show "Harmonized Variable" beside the type, but no dictionary field backs
    // it. A second badge arrives with the field, not before it.
    expect(screen.getAllByTestId('search-result-card-type')).toHaveLength(1);
  });

  it('omits the badge entirely when the dictionary gave no type', () => {
    renderCard({ type: undefined as unknown as SearchResult['type'] });

    expect(screen.queryByTestId('search-result-card-type')).toBeNull();
  });

  it("links to the variable's detail page in the section being searched", () => {
    renderCard();

    expect(card()).toHaveAttribute(
      'href',
      '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
    );
  });

  it('links into Discover from a Discover search', () => {
    renderCard({}, { section: 'discover' });

    expect(card()).toHaveAttribute(
      'href',
      '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
    );
  });

  it('carries the search term on the link, so a copied link keeps the search', () => {
    renderCard({}, { searchTerm: 'age at exam' });

    expect(card()).toHaveAttribute(
      'href',
      '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C?search=age%20at%20exam',
    );
  });

  it('is a real link, not a div that navigates', () => {
    renderCard();

    // Enter, middle-click, modifier-click and Copy Link Address all come free from the
    // element; none of them are this component's code to get right.
    expect(card().tagName).toBe('A');
  });

  /**
   * The dataset is dictionary text - `pathToSearchResult` derives it from a concept path's
   * first segment - and the detail route refuses anything outside its allow-list, which is a
   * security control. So the card has to agree with the route rather than hand the user a
   * link that opens onto "We could not read that variable link".
   */
  describe('a variable the detail route will not accept', () => {
    // A study named the way the mockups name them, not an attack.
    const unlinkable = { dataset: 'BioLINCC (phs004266)' };

    it('renders no link at all', () => {
      renderCard(unlinkable);

      expect(card().tagName).not.toBe('A');
      expect(card()).not.toHaveAttribute('href');
    });

    it('says on the card that it cannot be opened', () => {
      renderCard(unlinkable);

      expect(screen.getByTestId('search-result-card-unopenable')).toHaveTextContent(
        'This variable cannot be opened',
      );
    });

    it('still shows the result, which is real even though it cannot be opened', () => {
      renderCard(unlinkable);

      expect(screen.getByTestId('search-result-card-description')).toHaveTextContent(
        'Age of the participant at the exam',
      );
      // Still the acronym: only the link is withheld, nothing about how the card reads.
      expect(screen.getByTestId('search-result-card-study')).toHaveTextContent('TDS');
      expect(screen.getByTestId('search-result-card-type')).toHaveTextContent('Continuous');
    });

    it('does not offer that message on a variable that opens fine', () => {
      renderCard();

      expect(screen.queryByTestId('search-result-card-unopenable')).toBeNull();
      expect(card()).toHaveAttribute('href');
    });
  });

  /**
   * Open access bars filtering on some variables, and the filter itself now lives a
   * navigation away - so a card that says nothing about it teaches the user which results are
   * worth opening only by making them open each one.
   *
   * One assertion per case, because they discriminate on different things: the marker the tour
   * and the e2e suite target, the words the user reads, and the section the rule applies in.
   * Bundled, whichever failed first would hide the rest - and the enabled/disabled pair is
   * exactly where that hides a card that is not marked at all.
   */
  describe('a variable open access will not let the user filter', () => {
    const unfilterable = { allowFiltering: false };
    const discover = { section: 'discover' };

    it('marks the card, so the state is addressable without reading the text', () => {
      renderCard(unfilterable, discover);

      expect(card()).toHaveAttribute('data-filterable', 'false');
    });

    it('explains it on the card, in the words the detail page will repeat', () => {
      renderCard(unfilterable, discover);

      expect(screen.getByTestId('search-result-card-filtering-unavailable')).toHaveTextContent(
        'Filtering is not available for this variable',
      );
    });

    it('says it in text, not colour alone, and inside the link so it is part of its name', () => {
      renderCard(unfilterable, discover);

      // The badge sits inside the anchor, so a screen reader announcing the link announces
      // this with it. An icon rides along for sighted users and is hidden from the reader so
      // it is not announced twice.
      const badge = screen.getByTestId('search-result-card-filtering-unavailable');
      expect(card().contains(badge)).toBe(true);
      expect(badge.querySelector('i')).toHaveAttribute('aria-hidden', 'true');
    });

    it('marks a filterable card too, so the two are told apart rather than one being blank', () => {
      renderCard({ allowFiltering: true }, discover);

      expect(card()).toHaveAttribute('data-filterable', 'true');
    });

    it('leaves a filterable card unexplained: there is nothing to explain', () => {
      renderCard({ allowFiltering: true }, discover);

      expect(screen.queryByTestId('search-result-card-filtering-unavailable')).toBeNull();
    });

    it('marks an unopenable card as well - the two states are independent', () => {
      // The unopenable branch renders its own element, so it needs its own case: a variable
      // can be both unlinkable and unfilterable, and the card the user sees is the div.
      renderCard({ ...unfilterable, dataset: 'BioLINCC (phs004266)' }, discover);

      expect(card()).toHaveAttribute('data-filterable', 'false');
      expect(screen.getByTestId('search-result-card-filtering-unavailable')).toBeInTheDocument();
    });

    it('says nothing of the kind on Explore, which is not open access', () => {
      // Unfilterable on purpose: a filterable variable would carry no state under either
      // rule, and the test would pass without the section mattering at all.
      renderCard(unfilterable, { section: 'explorer' });

      expect(screen.queryByTestId('search-result-card-filtering-unavailable')).toBeNull();
    });

    it('carries no filterable marking at all on Explore, not even a positive one', () => {
      renderCard(unfilterable, { section: 'explorer' });

      // Absent rather than `"true"`: an attribute asserting a variable is filterable is itself
      // a claim about open access, which Explore makes no claim about.
      expect(card()).not.toHaveAttribute('data-filterable');
    });

    it('applies to an anonymous visitor on Explore, as the row filter icon did', () => {
      // `isOpenAccess()` was `pathname.includes('/discover') || !isUserLoggedIn()`, and the
      // detail page keeps the second half. The card has to agree with the page it opens, so
      // it keeps it too.
      mockState.loggedIn = false;
      renderCard(unfilterable, { section: 'explorer' });

      expect(card()).toHaveAttribute('data-filterable', 'false');
    });
  });

  describe('as a place for focus to land', () => {
    it('is one tab stop and no more: the whole card is the link', () => {
      renderCard();

      // No tabindex of its own - an anchor with an href is already in the tab order, and a
      // tabindex here would be a second claim on it.
      expect(card()).not.toHaveAttribute('tabindex');
      expect(card().querySelectorAll('a, button, input, select, textarea')).toHaveLength(0);
    });

    it('lets focus land on an unopenable card without putting it in the tab order', () => {
      // Nothing to activate, so it is not a tab stop - but a keyboard page change focuses the
      // first card of the new page, and that card can be this one.
      //
      // The attribute is all this layer can say. happy-dom focuses a div with no tabindex just
      // as readily, so `focus()` here would pass with the attribute removed; that the browser
      // will not is pinned by `Lands on a first card that cannot be opened` in the e2e suite.
      renderCard({ dataset: 'BioLINCC (phs004266)' });

      expect(card()).toHaveAttribute('tabindex', '-1');
    });
  });

  it('logs the click with the variable it opened', async () => {
    renderCard();

    await fireEvent.click(card());

    expect(vi.mocked(log)).toHaveBeenCalledTimes(1);
    expect(createLog).toHaveBeenCalledWith(
      'ACTION',
      'search_result.card_click',
      expect.objectContaining({
        variable: 'Age at exam',
        conceptPath: '\\this\\is\\a\\age\\',
      }),
    );
  });
});

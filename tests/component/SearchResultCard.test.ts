// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

// The card's only job beyond the field mapping is to produce the detail-page href, so `resolve`
// is the identity here and the assertions below are on the URL the builder made.
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

// Open access is `isOpenAccess()`: the pathname says Discover, or nobody is signed in. Signed
// in on Explore by default, so an `explorer` card is the ordinary authenticated case.
const mockState = vi.hoisted(() => ({ pathname: '/explorer', loggedIn: true }));
vi.mock('$app/state', () => ({
  page: {
    get url() {
      return new URL(`http://localhost${mockState.pathname}`);
    },
  },
}));
vi.mock('$lib/stores/User', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/User')>()),
  isUserLoggedIn: () => mockState.loggedIn,
}));
vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
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
  mockState.pathname = '/explorer';
  mockState.loggedIn = true;
});

/** A Discover card: the section is decided from the pathname, as the results row decided it. */
function renderDiscoverCard(overrides: Partial<SearchResult> = {}) {
  mockState.pathname = '/discover';
  return renderCard(overrides, { section: 'discover' });
}

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

  it('is a real link, not a div that navigates', () => {
    renderCard();

    // Enter, middle-click, modifier-click and Copy Link Address all come free from the
    // element; none of them are this component's code to get right.
    expect(card().tagName).toBe('A');
  });

  it('logs the click with the variable it opened', async () => {
    renderCard();

    await fireEvent.click(card());

    expect(vi.mocked(log)).toHaveBeenCalledTimes(1);
    expect(createLog).toHaveBeenCalledWith(
      'ACTION',
      'search_result.row_click',
      expect.objectContaining({ variable: '\\this\\is\\a\\age\\' }),
    );
  });

  /**
   * Open access bars filtering on some variables, and the filter itself now lives a
   * navigation away - so a card that says nothing about it teaches the user which results are
   * worth opening only by making them open each one. One assertion per case, because they
   * discriminate on different things: the marker the tour and the e2e suite target, the words
   * the user reads, and the section the rule applies in.
   */
  describe('a variable open access will not let the user filter', () => {
    const unfilterable = { allowFiltering: false };

    it('marks the card, so the state is addressable without reading the text', () => {
      renderDiscoverCard(unfilterable);

      expect(card()).toHaveAttribute('data-filterable', 'false');
    });

    it('explains it on the card, in the words the detail page will repeat', () => {
      renderDiscoverCard(unfilterable);

      expect(screen.getByTestId('search-result-card-filtering-unavailable')).toHaveTextContent(
        'Filtering is not available for this variable',
      );
    });

    it('says it in text, not colour alone, and inside the link so it is part of its name', () => {
      renderDiscoverCard(unfilterable);

      const badge = screen.getByTestId('search-result-card-filtering-unavailable');
      expect(card().contains(badge)).toBe(true);
      expect(badge.querySelector('i')).toHaveAttribute('aria-hidden', 'true');
    });

    it('marks a filterable card too, so the two are told apart rather than one being blank', () => {
      renderDiscoverCard({ allowFiltering: true });

      expect(card()).toHaveAttribute('data-filterable', 'true');
      expect(screen.queryByTestId('search-result-card-filtering-unavailable')).toBeNull();
    });

    it('says nothing of the kind on Explore, which is not open access', () => {
      // Unfilterable on purpose: with a filterable variable the badge is absent in either
      // section, so the badge assertion alone would not depend on the section.
      renderCard(unfilterable, { section: 'explorer' });

      expect(screen.queryByTestId('search-result-card-filtering-unavailable')).toBeNull();
      // Absent rather than `"true"`: an attribute asserting a variable is filterable is itself
      // a claim about open access, which Explore makes no claim about.
      expect(card()).not.toHaveAttribute('data-filterable');
    });

    it('applies to an anonymous visitor on Explore, as the row filter icon did', () => {
      mockState.loggedIn = false;
      renderCard(unfilterable, { section: 'explorer' });

      expect(card()).toHaveAttribute('data-filterable', 'false');
    });
  });
});

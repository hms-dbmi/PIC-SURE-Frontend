// @vitest-environment happy-dom

import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const mockState = vi.hoisted(() => ({
  // HierarchyComponent reads the pathname to decide whether filtering is allowed; the page
  // itself is told its section rather than inferring one.
  pathname: '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C',
  section: 'explorer' as 'explorer' | 'discover',
  enableHierarchy: false,
  exportsEnableExport: true,
  loggedIn: true,
}));

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$app/state', () => ({
  page: {
    get url() {
      return new URL(`http://localhost${mockState.pathname}`);
    },
  },
}));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    get features() {
      return {
        explorer: {
          enableHierarchy: mockState.enableHierarchy,
          exportsEnableExport: mockState.exportsEnableExport,
        },
      };
    },
    branding: { applicationName: 'PIC-SURE', explorePage: { resultInfo: {} } },
  },
  resetConfig: () => {},
}));

import VariableDetail from '$lib/components/explorer/VariableDetail.svelte';
import { log } from '$lib/logger';
import { getConceptDetails, getHierarchyConcepts } from '$lib/stores/Dictionary';
import { exports, clearExports } from '$lib/stores/Export';
import { addFilter, clearFilters, filters, updateFilter } from '$lib/stores/Filter';
import { createCategoricalFilter, createNumericFilter } from '$lib/models/Filter.svelte';
import { searchTerm } from '$lib/stores/Search';
import type { SearchResult } from '$lib/models/Search';
import type { VariableKey } from '$lib/explorer/variableUrl';
import { optionsIn } from './helpers';

vi.mock('$lib/stores/Dictionary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/Dictionary')>()),
  getConceptDetails: vi.fn(),
  getHierarchyConcepts: vi.fn(),
}));

// The filter and export stores are the real ones - they are what the assertions are about -
// so only the two edges that would leave the process are replaced: the log POST and the
// toast host. `isUserLoggedIn` reads localStorage, which is the other half of the
// open-access rule.
vi.mock('$lib/logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/logger')>()),
  log: vi.fn(),
}));
vi.mock('$lib/toaster', () => ({ toaster: { error: vi.fn(), success: vi.fn() } }));
vi.mock('$lib/stores/User', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/User')>()),
  isUserLoggedIn: () => mockState.loggedIn,
}));

const variableKey: VariableKey = {
  dataset: 'test_data_set',
  conceptPath: '\\this\\is\\a\\age\\',
};

const detail = {
  conceptPath: '\\this\\is\\a\\age\\',
  dataset: 'test_data_set',
  name: 'age1',
  display: 'Age at exam',
  studyAcronym: 'TDS',
  description: 'Age',
  type: 'Continuous',
  allowFiltering: true,
} as SearchResult;

const categoricalDetail = {
  ...detail,
  conceptPath: '\\this\\is\\a\\smoker\\',
  name: 'smoker1',
  display: 'Ever smoked',
  type: 'Categorical',
  values: ['Yes', 'No', "Don't know"],
} as SearchResult;

const categoricalKey: VariableKey = {
  dataset: categoricalDetail.dataset,
  conceptPath: categoricalDetail.conceptPath,
};

async function renderDetail(overrides: Partial<SearchResult> = {}) {
  vi.mocked(getConceptDetails).mockResolvedValue({ ...detail, ...overrides });
  render(VariableDetail, { section: mockState.section, variableKey });
  await screen.findByTestId('variable-identity');
}

/** Renders with a dictionary that answers `response`, however unlike a concept it is. */
async function renderResponse(response: unknown) {
  vi.mocked(getConceptDetails).mockResolvedValue(response as SearchResult);
  render(VariableDetail, { section: mockState.section, variableKey });
  return screen.findByTestId('variable-detail-error');
}

/**
 * `error()` throws in SvelteKit 2 rather than returning, so this catches it to get the real
 * `HttpError` as a value - which is what `isHttpError` needs to recognise a 404, and what
 * `api.ts` throws via its own `fail()`.
 */
function httpError(status: number, message: string): unknown {
  try {
    error(status as 404, message);
  } catch (thrown) {
    return thrown;
  }
  throw new Error('error() unexpectedly did not throw');
}

/**
 * Waits for the page's own heading to read `name`.
 *
 * By test id, not by text: `ResultInfoComponent` renders the display name as its Name row
 * too, so `findByText` would match two elements and throw.
 */
function showsName(name: string) {
  return waitFor(() => expect(screen.getByTestId('variable-detail-name')).toHaveTextContent(name));
}

async function renderRejection(reason: unknown) {
  vi.mocked(getConceptDetails).mockRejectedValue(reason);
  render(VariableDetail, { section: mockState.section, variableKey });
  return screen.findByTestId('variable-detail-error');
}

describe('VariableDetail', () => {
  beforeEach(() => {
    cleanup();
    vi.mocked(getConceptDetails).mockReset();
    vi.mocked(getHierarchyConcepts).mockReset();
    vi.mocked(log).mockClear();
    mockState.pathname = '/explorer/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
    mockState.section = 'explorer';
    mockState.enableHierarchy = false;
    mockState.exportsEnableExport = true;
    mockState.loggedIn = true;
    // Both stores are module state, so they survive between tests in this file exactly as
    // they survive a navigation in the app.
    clearExports();
    clearFilters();
    searchTerm.set('');
  });

  it('looks the variable up by the key the route decoded', async () => {
    await renderDetail();
    expect(getConceptDetails).toHaveBeenCalledWith('\\this\\is\\a\\age\\', 'test_data_set');
  });

  describe('the identity block', () => {
    it('is the name in bold, the study beneath it and a type badge', async () => {
      await renderDetail();

      const name = screen.getByTestId('variable-detail-name');
      expect(name).toHaveTextContent('Age at exam');
      expect(name).toHaveClass('font-bold');
      expect(screen.getByTestId('variable-detail-study')).toHaveTextContent('TDS');
      expect(screen.getByTestId('variable-detail-type')).toHaveTextContent('Continuous');
    });

    it('falls back to the accession when the variable has no display name', async () => {
      await renderDetail({ display: '' });
      expect(screen.getByTestId('variable-detail-name')).toHaveTextContent('age1');
    });

    // The card's rule, and the same fallback: an absent acronym leaves the study ref.
    it('falls back to the dataset when the study has no acronym', async () => {
      await renderDetail({ studyAcronym: '' });
      expect(screen.getByTestId('variable-detail-study')).toHaveTextContent('test_data_set');
    });
  });

  // This is the one page in the feature designed to be shared, so its tab, history entry and
  // bookmark have to say which variable rather than only which section.
  describe('the document title', () => {
    it('names the variable once it has loaded', async () => {
      await renderDetail();
      expect(document.title).toBe('PIC-SURE | Age at exam');
    });

    it('names the section before then, and when there is nothing to name', async () => {
      await renderRejection(httpError(404, 'not found'));
      expect(document.title).toBe('PIC-SURE | Explorer');
    });

    it('names Discover on a Discover detail page', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      await renderRejection(httpError(404, 'not found'));
      expect(document.title).toBe('PIC-SURE | Discover');
    });
  });

  describe('Back to Search Results', () => {
    it('is a link to the section root, carrying the active search', async () => {
      searchTerm.set('age at exam');
      await renderDetail();

      const back = screen.getByTestId('variable-detail-back');
      expect(back.tagName).toBe('A');
      expect(back).toHaveAttribute('href', '/explorer?search=age%20at%20exam');
    });

    it('is the bare section root when there is no search to return to', async () => {
      await renderDetail();
      expect(screen.getByTestId('variable-detail-back')).toHaveAttribute('href', '/explorer');
    });

    it('returns to Discover from a Discover detail page', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      searchTerm.set('age');
      await renderDetail();
      expect(screen.getByTestId('variable-detail-back')).toHaveAttribute(
        'href',
        '/discover?search=age',
      );
    });
  });

  describe('sections', () => {
    it('renders Variable Information', async () => {
      await renderDetail();
      expect(screen.getByTestId('variable-detail-information')).toBeInTheDocument();
      expect(await screen.findByTestId('variable-info')).toBeInTheDocument();
    });

    it('omits the hierarchy when the deployment has it turned off', async () => {
      await renderDetail();
      expect(screen.queryByTestId('variable-detail-hierarchy')).not.toBeInTheDocument();
      expect(getHierarchyConcepts).not.toHaveBeenCalled();
    });

    it('renders the hierarchy when the deployment has it turned on', async () => {
      mockState.enableHierarchy = true;
      vi.mocked(getHierarchyConcepts).mockResolvedValue([detail]);
      await renderDetail();

      expect(screen.getByTestId('variable-detail-hierarchy')).toBeInTheDocument();
      expect(await screen.findByTestId('hierarchy-component')).toBeInTheDocument();
      expect(getHierarchyConcepts).toHaveBeenCalledWith('test_data_set', '\\this\\is\\a\\age\\');
    });
  });

  // Ticket 11 removes the per-row Info / Filter / Hierarchy / Add-for-Analysis icons, so this
  // page has to be somewhere the user can act from. The filter interface is AddFilter dropped
  // in as-is; ticket 13 replaces its layout.
  describe('the filter interface', () => {
    const filterSection = () => screen.getByTestId('variable-detail-filter');
    const addFilterButton = () => filterSection().querySelector('[data-testid="add-filter"]')!;

    it('adds a filter for this variable without leaving the page', async () => {
      await renderDetail();

      await fireEvent.input(screen.getByTestId('min-input'), { target: { value: '21' } });
      await fireEvent.click(addFilterButton());

      expect(get(filters)).toHaveLength(1);
      const [filter] = get(filters);
      expect(filter.id).toBe('\\this\\is\\a\\age\\');
      expect(filter.filterType).toBe('numeric');
      expect(filter).toMatchObject({ min: '21' });
      // Nothing here can navigate, so this is a smoke check rather than the control for
      // staying on the page - the e2e spec asserts the URL for that.
      expect(screen.getByTestId('variable-identity')).toBeInTheDocument();
    });

    // `AddFilter` reads `existingFilter` from the prop at click time, so this holds with or
    // without the `{#key}` below - it pins the outcome, not the mechanism. The key earns its
    // place in the modal-edit test further down, which does fail without it.
    it('updates the filter it already added rather than adding a second', async () => {
      await renderDetail();

      await fireEvent.input(screen.getByTestId('min-input'), { target: { value: '21' } });
      await fireEvent.click(addFilterButton());
      expect(get(filters)).toHaveLength(1);

      await fireEvent.input(await screen.findByTestId('min-input'), { target: { value: '30' } });
      await fireEvent.click(addFilterButton());

      expect(get(filters)).toHaveLength(1);
      expect(get(filters)[0]).toMatchObject({ min: '30' });
    });

    it('opens with the selection of a filter this variable already has', async () => {
      addFilter(createCategoricalFilter(categoricalDetail, ['Yes']));
      vi.mocked(getConceptDetails).mockResolvedValue(categoricalDetail);

      render(VariableDetail, { section: 'explorer', variableKey: categoricalKey });
      await screen.findByTestId('variable-identity');
      await screen.findByTestId('optional-selection-list');

      expect(optionsIn('selected-options-container')).toEqual(['Yes']);
      expect(optionsIn('options-container')).toEqual(['No', "Don't know"]);
      // Editing, not adding: the second value joins the filter that is already there.
      await fireEvent.click(screen.getByRole('checkbox', { name: 'No' }));
      await fireEvent.click(addFilterButton());

      expect(get(filters)).toHaveLength(1);
      // Sorted: OptionsSelectionList sorts on every selection.
      expect(get(filters)[0]).toMatchObject({ categoryValues: ['No', 'Yes'] });
    });

    // A numeric filter round-trips through its own inputs rather than the selection list, so
    // it needs its own case - the two branches of AddFilter's onMount are independent.
    it('opens with the bounds of a numeric filter this variable already has', async () => {
      addFilter(createNumericFilter(detail, '18', '65'));
      await renderDetail();

      expect(screen.getByTestId('min-input')).toHaveValue('18');
      expect(screen.getByTestId('max-input')).toHaveValue('65');
    });

    // Matching Actions.svelte: the rule is open access *and* the dictionary refusing, not
    // either alone.
    it('is refused, with an explanation, for an unfilterable variable in open access', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      await renderDetail({ allowFiltering: false });

      expect(screen.getByTestId('variable-detail-filter-disabled')).toHaveTextContent(
        'Filtering is not available for this variable',
      );
      expect(screen.queryByTestId('filter-component')).not.toBeInTheDocument();
    });

    it('is offered to an authenticated user even where the dictionary refuses it', async () => {
      await renderDetail({ allowFiltering: false });

      expect(screen.queryByTestId('variable-detail-filter-disabled')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-component')).toBeInTheDocument();
    });

    /*
     * AddFilter renders an options list for Categorical and min/max inputs for Continuous,
     * and nothing at all for any other type - but its add button is unconditional, and
     * `addNewFilter` falls through to `createNumericFilter(data, undefined, undefined)` for
     * a type it has no inputs for. Ungated, the user got a bare `+` under the heading and one
     * click put a filter restricting nothing into their cohort.
     *
     * This page is addressed by URL, so a shared or hand-edited link can name a non-leaf
     * concept, and `isConcept` admits one on conceptPath and dataset alone.
     */
    it.each([
      { case: 'a category rather than a leaf variable', type: 'AnyRecordOf' },
      { case: 'a concept the dictionary gave no type', type: undefined },
    ])('offers nothing to fill in, and no add button, for $case', async ({ type }) => {
      await renderDetail({ type } as Partial<SearchResult>);

      expect(screen.getByTestId('variable-detail-filter-unavailable')).toHaveTextContent(
        'This concept has no values to filter on',
      );
      expect(screen.queryByTestId('filter-component')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-filter')).not.toBeInTheDocument();
    });

    // The other side of that gate, so closing it altogether is not a way to pass the tests
    // above.
    it.each([
      { type: 'Continuous' as const, key: variableKey, detail },
      { type: 'Categorical' as const, key: categoricalKey, detail: categoricalDetail },
    ])('is offered for a $type variable', async ({ key, detail: concept }) => {
      vi.mocked(getConceptDetails).mockResolvedValue(concept);
      render(VariableDetail, { section: 'explorer', variableKey: key });
      await screen.findByTestId('variable-identity');

      expect(await screen.findByTestId('filter-component')).toBeInTheDocument();
      expect(screen.getByTestId('add-filter')).toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-filter-unavailable')).not.toBeInTheDocument();
    });

    /*
     * Two views of one filter render on this page: the cohort panel's edit pencil opens its
     * own AddFilter in a modal over it, and `updateFilter` preserves the uuid. An interface
     * keyed on identity alone would still hold the selection it read at mount, so the next
     * add here would write that stale selection back over the user's edit.
     */
    it('re-reads a filter edited from the cohort panel, and does not undo the edit', async () => {
      addFilter(createCategoricalFilter(categoricalDetail, ['Yes']));
      vi.mocked(getConceptDetails).mockResolvedValue(categoricalDetail);
      render(VariableDetail, { section: 'explorer', variableKey: categoricalKey });
      await screen.findByTestId('optional-selection-list');
      expect(optionsIn('selected-options-container')).toEqual(['Yes']);

      // The edit the modal makes: the same filter, the same uuid, one more value.
      const { uuid } = get(filters)[0];
      updateFilter(uuid, createCategoricalFilter(categoricalDetail, ['Yes', "Don't know"]));

      await waitFor(() =>
        expect(optionsIn('selected-options-container')).toEqual(['Yes', "Don't know"]),
      );
      // Still one filter, still the same one - this is an edit, not a replacement.
      expect(get(filters)).toHaveLength(1);
      expect(get(filters)[0].uuid).toBe(uuid);

      // And adding from this page carries the edit forward instead of reverting it.
      await fireEvent.click(addFilterButton());
      expect(get(filters)).toHaveLength(1);
      expect(get(filters)[0]).toMatchObject({ categoryValues: ['Yes', "Don't know"] });
    });

    it('is offered in open access for a variable the dictionary allows', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      await renderDetail();

      expect(screen.queryByTestId('variable-detail-filter-disabled')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-component')).toBeInTheDocument();
    });
  });

  // Add for Analysis is the one of the four row actions with nowhere else to go, so it is the
  // one that must not be dropped when ticket 11 removes the icons.
  describe('Add for Analysis', () => {
    const toggle = () => screen.getByTestId('variable-detail-export-toggle');
    const exportedPaths = () => get(exports).map((item) => item.conceptPath);

    it('adds and removes the variable from Added Variables', async () => {
      await renderDetail();
      expect(toggle()).toHaveTextContent('Add for Analysis');

      await fireEvent.click(toggle());
      expect(exportedPaths()).toEqual(['\\this\\is\\a\\age\\']);
      expect(toggle()).toHaveTextContent('Remove from Analysis');

      await fireEvent.click(toggle());
      expect(exportedPaths()).toEqual([]);
      expect(toggle()).toHaveTextContent('Add for Analysis');
    });

    it('opens already added when the variable is in Added Variables', async () => {
      await renderDetail();
      await fireEvent.click(toggle());
      cleanup();

      await renderDetail();
      expect(toggle()).toHaveTextContent('Remove from Analysis');
    });

    /**
     * EXISTING-ISSUES item 18, which this page must not inherit.
     *
     * `Actions.svelte` tests membership with `$exports.includes(exportItem)` where
     * `exportItem` is `$derived(mapSearchResultAsExport(data.row))` - a fresh object literal
     * on every derivation. Anything that refetches the concept (a new search term, a facet
     * selection, a trip through Discover) replaces the object, `includes` goes false, the
     * click takes the add branch, and `addExport` early-returns because the concept path is
     * already there: the button reads "Remove from Analysis" and does nothing.
     *
     * The refetch here is the real one - a fresh key re-runs the load - and the dictionary
     * answers with a different object. The heading is rendered straight off that object, so a
     * heading reading v2 is proof the page is no longer holding the object it held when the
     * user clicked: nothing mutates a loaded concept in place.
     */
    it('still removes the variable after the concept has been fetched again', async () => {
      let generation = 1;
      // A fresh object per call, which is what a fetch gives.
      vi.mocked(getConceptDetails).mockImplementation(() =>
        Promise.resolve({ ...detail, display: `Age at exam v${generation}` }),
      );

      const { rerender } = render(VariableDetail, { section: 'explorer', variableKey });
      await showsName('Age at exam v1');
      await fireEvent.click(toggle());
      expect(exportedPaths()).toEqual(['\\this\\is\\a\\age\\']);

      generation = 2;
      await rerender({ section: 'explorer', variableKey: { ...variableKey } });
      await showsName('Age at exam v2');

      expect(toggle()).toHaveTextContent('Remove from Analysis');
      await fireEvent.click(toggle());

      expect(exportedPaths()).toEqual([]);
      expect(toggle()).toHaveTextContent('Add for Analysis');
    });

    // These two event names are the only record of an add or a remove once ticket 11 deletes
    // the row icons that emitted `search_result.export_add` / `_remove`, and nothing else in
    // the repo names them.
    it('logs the add and the remove, naming the variable each happened to', async () => {
      await renderDetail();

      await fireEvent.click(toggle());
      expect(log).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'ACTION',
          action: 'variable_detail.export_add',
          metadata: expect.objectContaining({
            variable: 'Age at exam',
            conceptPath: '\\this\\is\\a\\age\\',
          }),
        }),
      );

      await fireEvent.click(toggle());
      expect(log).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'ACTION',
          action: 'variable_detail.export_remove',
          metadata: expect.objectContaining({
            variable: 'Age at exam',
            conceptPath: '\\this\\is\\a\\age\\',
          }),
        }),
      );
    });

    it('is absent where the deployment has exports turned off', async () => {
      mockState.exportsEnableExport = false;
      await renderDetail();
      expect(screen.queryByTestId('variable-detail-export-toggle')).not.toBeInTheDocument();
    });

    it('is absent on Discover', async () => {
      mockState.pathname = '/discover/variable/test_data_set/%5Cthis%5Cis%5Ca%5Cage%5C';
      mockState.section = 'discover';
      await renderDetail();
      expect(screen.queryByTestId('variable-detail-export-toggle')).not.toBeInTheDocument();
    });

    it('is absent for a visitor who is not logged in', async () => {
      mockState.loggedIn = false;
      await renderDetail();
      expect(screen.queryByTestId('variable-detail-export-toggle')).not.toBeInTheDocument();
    });

    // `isOpenAccess()` would answer yes here, because it tests
    // `pathname.includes('/discover')` and the dataset segment is dictionary data. This page
    // is told its section instead, so a dataset that spells a route name changes nothing.
    // Two harms, two tests: asserted together, whichever failed first would hide the other,
    // and the filter one is the half that needs `allowFiltering: false` to discriminate at all.
    it('keeps the toggle for a dataset named after the other section', async () => {
      mockState.pathname = '/explorer/variable/discover/%5Cthis%5Cis%5Ca%5Cage%5C';
      await renderDetail({ dataset: 'discover' });

      expect(toggle()).toBeInTheDocument();
    });

    it('keeps filtering for a dataset named after the other section', async () => {
      mockState.pathname = '/explorer/variable/discover/%5Cthis%5Cis%5Ca%5Cage%5C';
      // Unfilterable, so this is the case the substring rule would refuse. Left filterable,
      // the filter is offered under either rule and the test proves nothing.
      await renderDetail({ dataset: 'discover', allowFiltering: false });

      expect(screen.queryByTestId('variable-detail-filter-disabled')).not.toBeInTheDocument();
      expect(screen.getByTestId('filter-component')).toBeInTheDocument();
    });
  });

  // Blank, not crashing, is the failure mode to avoid: the user has no way to tell a broken
  // link from a broken app, and no way back either. The copy has to tell them apart too, or
  // an outage reads to every user as their own link being stale.
  describe('errors', () => {
    it('explains a key that addresses nothing, and still offers a way back', async () => {
      render(VariableDetail, { section: 'explorer' });

      expect(await screen.findByTestId('variable-detail-error')).toHaveTextContent(
        'We could not read that variable link',
      );
      expect(screen.getByTestId('variable-detail-back')).toBeInTheDocument();
      expect(getConceptDetails).not.toHaveBeenCalled();
    });

    it('reads a 404 as a stale link', async () => {
      expect(await renderRejection(httpError(404, 'not found'))).toHaveTextContent(
        'We could not find that variable',
      );
    });

    it.each([
      { case: 'a dictionary 500', reason: httpError(500, 'boom') },
      { case: 'a gateway timeout', reason: httpError(504, 'timeout') },
      { case: 'a forbidden response', reason: httpError(403, 'no') },
      { case: 'an empty body', reason: new Error('No response') },
      { case: 'a network failure', reason: new TypeError('Failed to fetch') },
    ])('reads $case as a service problem, not a stale link', async ({ reason }) => {
      const alert = await renderRejection(reason);
      expect(alert).toHaveTextContent('We could not load that variable');
      expect(alert).toHaveTextContent('contact an administrator');
      expect(alert).not.toHaveTextContent('since the link was made');
    });

    // A 200 is not proof of a concept. Rendering one of these gave an empty heading and
    // handed ResultInfoComponent a result with no concept path, whose own {#await} has no
    // catch - a card that spins forever.
    it('reads an empty object as the dictionary holding nothing for the key', async () => {
      expect(await renderResponse({})).toHaveTextContent('We could not find that variable');
      expect(screen.queryByTestId('variable-identity')).not.toBeInTheDocument();
    });

    it('reads a concept missing its dataset as holding nothing for the key', async () => {
      expect(await renderResponse({ conceptPath: '\\a\\b\\' })).toHaveTextContent(
        'We could not find that variable',
      );
    });

    it.each([
      { case: 'a proxy interstitial', response: '<html>Access Denied</html>' },
      { case: 'an empty string body', response: '' },
      { case: 'nothing at all', response: undefined },
    ])('reads $case as a service problem', async ({ response }) => {
      expect(await renderResponse(response)).toHaveTextContent('We could not load that variable');
    });

    it('renders no identity, information or hierarchy alongside an error', async () => {
      mockState.enableHierarchy = true;
      await renderRejection(httpError(500, 'boom'));

      expect(screen.queryByTestId('variable-identity')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-information')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-filter')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-detail-hierarchy')).not.toBeInTheDocument();
      expect(getHierarchyConcepts).not.toHaveBeenCalled();
    });
  });
});

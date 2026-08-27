import { get, writable, type Unsubscriber, type Writable } from 'svelte/store';

import { subscribeOnChange } from '$lib/utilities/Subscribers';

import { TableHandler, type State } from '@vincjo/datatables/server';

import { type Facet, type SearchResult } from '$lib/models/Search';
import { searchDictionary } from '$lib/stores/Dictionary';
import { updateFacetsFromSearch, facetsPromise, resetFacetState } from '$lib/stores/Dictionary';
import { expandedNestedFacets } from '$lib/stores/NestedFacets';
import { getDefaultRows } from '$lib/components/datatable/stores';
import { isAbortError } from '$lib/api';
import { log, createLog, getPageContext } from '$lib/logger';

export const loading: Writable<boolean> = writable(false);
export const searchTerm: Writable<string> = writable('');
export const selectedFacets: Writable<Facet[]> = writable([]);
export const tableHandler: TableHandler = new TableHandler([] as SearchResult[], {
  rowsPerPage: getDefaultRows('ExplorerTable'),
  debounce: 250,
});
export const tour: Writable<boolean> = writable(true);
export const error: Writable<string> = writable('');

const emptyFn = () => {};
const unsubscribers: { [key: string]: Unsubscriber } = {
  searchTerm: emptyFn,
  selectedFacets: emptyFn,
};

let isResetting = false;

// Must stay separate: every load refetches concepts, only criteria changes
// refetch facets. Merging them lets pagination discard a wanted facet response.
let conceptGeneration = 0;
let facetGeneration = 0;
let conceptController: AbortController | undefined;
let facetController: AbortController | undefined;
let previousCriteria: string | null = null;

let activeToken: symbol | null = null;

function beginConceptLoad() {
  conceptController?.abort();
  conceptController = new AbortController();
  return { generation: ++conceptGeneration, signal: conceptController.signal };
}

function supersedeConcepts() {
  conceptController?.abort();
  conceptController = undefined;
  conceptGeneration++;
}

function beginFacetLoad() {
  const controller = new AbortController();
  const previous = facetController;
  facetController = controller;
  return { generation: ++facetGeneration, signal: controller.signal, previous };
}

const isConceptCurrent = (generation: number) => generation === conceptGeneration;
const isFacetCurrent = (generation: number) => generation === facetGeneration;

function criteriaKey(term: string, facets: Facet[]): string {
  return JSON.stringify([term.trim(), facets.map((f) => `${f.category}:${f.name}`).sort()]);
}

export type SearchOutcome = 'loaded' | 'failed' | 'cancelled' | 'timeout';

let settleWaiters: ((outcome: SearchOutcome) => void)[] = [];

function settleSearch(outcome: SearchOutcome) {
  const waiters = settleWaiters;
  settleWaiters = [];
  waiters.forEach((resolve) => resolve(outcome));
}

/** Resolves when the next non-superseded load finishes. Never rejects. */
export function nextSearchSettled(timeoutMs = 30000): Promise<SearchOutcome> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      settleWaiters = settleWaiters.filter((w) => w !== waiter);
      resolve('timeout');
    }, timeoutMs);
    const waiter = (outcome: SearchOutcome) => {
      clearTimeout(timer);
      resolve(outcome);
    };
    settleWaiters.push(waiter);
  });
}

function teardown() {
  activeToken = null;
  conceptController?.abort();
  facetController?.abort();
  conceptController = undefined;
  facetController = undefined;
  conceptGeneration++;
  facetGeneration++;
  previousCriteria = null;
  resetFacetState();
  tableHandler.rows = [];
  tableHandler.totalRows = 0;
  facetsPromise.set(Promise.resolve([]));
  error.set('');
  loading.set(false);
  settleSearch('cancelled');
}

/** Returns this instance's teardown; a stale instance's is a no-op. */
export function initHandler(): () => void {
  Object.values(unsubscribers).forEach((unsub) => unsub());
  teardown();
  const token = Symbol('explorer-search');
  activeToken = token;

  const onCriteriaChange = () => {
    supersedeConcepts();
    loading.set(true);
    if (!isResetting) tableHandler.setPage(1);
  };

  unsubscribers.selectedFacets = subscribeOnChange(selectedFacets, onCriteriaChange);
  unsubscribers.searchTerm = subscribeOnChange(searchTerm, onCriteriaChange);

  const loadRows = async (state: State): Promise<SearchResult[] | undefined> => {
    if (activeToken !== token) return undefined;

    const term = get(searchTerm);
    const facets = get(selectedFacets);
    const { generation, signal } = beginConceptLoad();
    loading.set(true);
    error.set('');
    if (get(tour) && (term || facets.length > 0)) {
      tour.set(false);
    }
    try {
      const key = criteriaKey(term, facets);
      // Starts null so the first load refetches: a bare /explorer visit has empty
      // criteria but still needs the unfiltered facet list.
      const criteriaChanged = key !== previousCriteria;
      previousCriteria = key;

      if (criteriaChanged) {
        const { generation: facetGen, signal: facetSignal, previous } = beginFacetLoad();
        const next = updateFacetsFromSearch({
          signal: facetSignal,
          isCurrent: () => isFacetCurrent(facetGen),
        });
        next.catch((e) => {
          // Rolled back so the next load retries: `key` was recorded before the
          // request resolved, so unchanged criteria would otherwise never refetch.
          if (!isAbortError(e) && isFacetCurrent(facetGen) && previousCriteria === key) {
            previousCriteria = null;
          }
        });
        // Publish before aborting: the {#await} must already track `next`, or the
        // old promise rejects while still bound and flashes its catch branch.
        facetsPromise.set(next);
        previous?.abort();
      }
      return await search(state, generation, signal);
    } catch {
      return undefined;
    } finally {
      if (isConceptCurrent(generation)) {
        loading.set(false);
        settleSearch(get(error) ? 'failed' : 'loaded');
      }
    }
  };

  // Returning undefined is how a superseded load declines to write: FetchHandler
  // guards its assignment with `if (data)`. The library's types say Promise<T[]>
  // and do not express that, so the cast is load-bearing - see
  // @vincjo/datatables/dist/src/server/handlers/FetchHandler.svelte.js `trigger()`.
  tableHandler.load(loadRows as (state: State) => Promise<SearchResult[]>);

  return () => {
    if (activeToken === token) teardown();
  };
}

async function search(
  state: State,
  generation: number,
  signal?: AbortSignal,
): Promise<SearchResult[] | undefined> {
  const errorText =
    'An error occurred while searching. If the problem persists, please contact an administrator.';
  const facets = get(selectedFacets);
  const term = get(searchTerm);
  if (!term && !facets.length) {
    state.setTotalRows(0);
    // Truthy on purpose: this is the reset case, where clearing the table is right.
    return [];
  }
  log(
    createLog('SEARCH', 'search.dictionary', {
      term,
      facetCount: facets.length,
      pageContext: getPageContext(),
      page: state.currentPage,
      pageSize: state.rowsPerPage,
    }),
  );
  const search = searchDictionary(
    term.trim(),
    facets,
    {
      pageNumber: state.currentPage - 1,
      pageSize: state.rowsPerPage,
    },
    { signal },
  );
  const response = await search.catch((e) => {
    if (isAbortError(e) || !isConceptCurrent(generation)) {
      throw e;
    }
    console.error(e);
    state.setTotalRows(0);
    error.set(errorText);
    throw e;
  });

  if (!isConceptCurrent(generation)) {
    return undefined;
  }

  if (!response) {
    error.set(errorText);
  }
  log(
    createLog('SEARCH', 'search.results', {
      term,
      totalResults: response?.totalElements ?? 0,
      facetCount: facets.length,
      pageContext: getPageContext(),
    }),
  );
  state.setTotalRows(response?.totalElements ?? 0);
  return response?.content ?? [];
}

export async function updateFacets(facetsToUpdate: Facet[]) {
  const currentFacets = [...get(selectedFacets)];
  facetsToUpdate.forEach((facet) => {
    const facetIndex = currentFacets.findIndex((f) => f.name === facet.name);
    if (facetIndex !== -1) {
      log(
        createLog('SEARCH', 'facet.remove', {
          facet: facet.name,
          category: facet.category,
          pageContext: getPageContext(),
        }),
      );
      currentFacets.splice(facetIndex, 1);
    } else {
      log(
        createLog('SEARCH', 'facet.add', {
          facet: facet.name,
          category: facet.category,
          pageContext: getPageContext(),
        }),
      );
      currentFacets.push(facet);
    }
  });

  selectedFacets.set(currentFacets.sort((a, b) => b.count - a.count));
}

export function resetSearch() {
  log(createLog('SEARCH', 'search.reset', { pageContext: getPageContext() }));
  isResetting = true;
  searchTerm.set('');
  selectedFacets.set([]);
  expandedNestedFacets.set([]);
  error.set('');
  tour.set(true);
  isResetting = false;
  tableHandler.setPage(1);
}

export default {
  selectedFacets,
  searchTerm,
  error,
  updateFacets,
  resetSearch,
};

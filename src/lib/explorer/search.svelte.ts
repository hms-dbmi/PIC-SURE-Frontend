import { TableHandler, type State } from '@vincjo/datatables/server';

import type { DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';
import { isAbortError } from '#lib/api/errors.ts';
import { searchDictionary, searchFacets } from '#lib/explorer/Dictionary.ts';
import type { Facet, SearchResult } from '#lib/explorer/types.ts';
import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';
import { getDefaultRows } from '#lib/ui/datatable/rowsPerPage.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

export type SearchOutcome = 'loaded' | 'failed' | 'cancelled' | 'timeout';

/** Facet names per category that the sidebar hides. */
export type FacetSkeleton = {
  [facetCategory: string]: string[];
};

// JSON encoding is injective; a plain `:` join would collide when names contain `:`.
export function nestedFacetKey(category: string, facetName: string): string {
  return JSON.stringify([category, facetName]);
}

function criteriaKey(term: string, facets: Facet[]): string {
  return JSON.stringify([term.trim(), facets.map((f) => `${f.category}:${f.name}`).sort()]);
}

// A facet with a count of zero is never shown; consent filters produce them.
function zeroCountFacets(response: DictionaryFacetResult[]): FacetSkeleton {
  return Object.fromEntries(
    response.map((category) => [
      category.name,
      category.facets.filter((f) => f.count === 0).map((f) => f.name),
    ]),
  );
}

const SEARCH_ERROR =
  'An error occurred while searching. If the problem persists, please contact an administrator.';

/**
 * Explorer search: the term and selected facets, the facet sidebar's state, and the results
 * table that loads concepts for them. One instance per tab (`explorerSearch`); the Explorer
 * page drives it between `start()` and the release function that returns.
 */
export class ExplorerSearch {
  #term = $state('');
  #selectedFacets: Facet[] = $state.raw([]);
  #loading = $state(false);
  #error = $state('');
  #tour = $state(true);

  // The last committed facet response; undefined until the first one arrives. It stays in
  // place while a refetch runs, so a facet click doesn't rebuild the sidebar.
  #facetCategories: DictionaryFacetResult[] | undefined = $state.raw();
  #facetsFailed = $state(false);
  #hiddenFacets: FacetSkeleton = $state.raw({});
  #openFacets: string[] = $state.raw([]);
  // Keyed by nestedFacetKey: facet names repeat across categories. Survives facet reloads and
  // searching away and back; cleared by reset() and the tour.
  #expandedNestedFacets: string[] = $state.raw([]);

  #table: TableHandler<SearchResult> | undefined;

  // Must stay separate: every load refetches concepts, only criteria changes refetch facets.
  // Merging them lets pagination discard a wanted facet response.
  #conceptGeneration = 0;
  #facetGeneration = 0;
  #conceptController: AbortController | undefined;
  #facetController: AbortController | undefined;
  #previousCriteria: string | null = null;
  #lastAutoOpened: string | null = null;
  #resetting = false;
  #activeToken: symbol | null = null;
  #settleWaiters: ((outcome: SearchOutcome) => void)[] = [];

  get term() {
    return this.#term;
  }
  get selectedFacets() {
    return this.#selectedFacets;
  }
  get loading() {
    return this.#loading;
  }
  get error() {
    return this.#error;
  }
  get tour() {
    return this.#tour;
  }
  get facetCategories() {
    return this.#facetCategories;
  }
  get facetsFailed() {
    return this.#facetsFailed;
  }
  get hiddenFacets() {
    return this.#hiddenFacets;
  }
  get openFacets() {
    return this.#openFacets;
  }
  get expandedNestedFacets() {
    return this.#expandedNestedFacets;
  }
  get hasCriteria() {
    return this.#term !== '' || this.#selectedFacets.length > 0;
  }

  /** Created on first use, so rows-per-page is read in the browser rather than at import. */
  get table(): TableHandler<SearchResult> {
    this.#table ??= new TableHandler([] as SearchResult[], {
      rowsPerPage: getDefaultRows('ExplorerTable'),
      debounce: 250,
    });
    return this.#table;
  }

  setTerm = (term: string) => {
    assertNoSsrWrite('explorerSearch');
    if (term === this.#term) return;
    this.#term = term;
    this.#criteriaChanged();
  };

  setFacets = (facets: Facet[]) => {
    assertNoSsrWrite('explorerSearch');
    this.#selectedFacets = facets;
    this.#criteriaChanged();
  };

  toggleFacets = (facets: Facet[]) => {
    const next = [...this.#selectedFacets];
    facets.forEach((facet) => {
      const index = next.findIndex((f) => f.name === facet.name);
      log(
        createLog('SEARCH', index === -1 ? 'facet.add' : 'facet.remove', {
          facet: facet.name,
          category: facet.category,
          pageContext: getPageContext(),
        }),
      );
      if (index === -1) next.push(facet);
      else next.splice(index, 1);
    });
    this.setFacets(next.sort((a, b) => b.count - a.count));
  };

  clearError = () => {
    assertNoSsrWrite('explorerSearch');
    this.#error = '';
  };

  showTour = () => {
    assertNoSsrWrite('explorerSearch');
    this.#tour = true;
  };

  setOpenFacets = (categories: string[]) => {
    assertNoSsrWrite('explorerSearch');
    this.#openFacets = categories;
  };

  toggleNestedFacet = (key: string) => {
    assertNoSsrWrite('explorerSearch');
    const keys = this.#expandedNestedFacets;
    this.#expandedNestedFacets = keys.includes(key)
      ? keys.filter((k) => k !== key)
      : [...keys, key];
  };

  collapseNestedFacets = () => {
    assertNoSsrWrite('explorerSearch');
    this.#expandedNestedFacets = [];
  };

  reset = () => {
    assertNoSsrWrite('explorerSearch');
    log(createLog('SEARCH', 'search.reset', { pageContext: getPageContext() }));
    this.#resetting = true;
    this.setTerm('');
    this.setFacets([]);
    this.#expandedNestedFacets = [];
    this.#error = '';
    this.#tour = true;
    this.#resetting = false;
    this.#table?.setPage(1);
  };

  /** Resolves when the next non-superseded load finishes. Never rejects. */
  nextSettled = (timeoutMs = 30000): Promise<SearchOutcome> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.#settleWaiters = this.#settleWaiters.filter((w) => w !== waiter);
        resolve('timeout');
      }, timeoutMs);
      const waiter = (outcome: SearchOutcome) => {
        clearTimeout(timer);
        resolve(outcome);
      };
      this.#settleWaiters.push(waiter);
    });
  };

  /**
   * Attaches the results table's loader for one mounted Explorer. Returns that instance's
   * teardown; a stale instance's is a no-op.
   */
  start(): () => void {
    assertNoSsrWrite('explorerSearch');
    this.#teardown();
    const token = Symbol('explorer-search');
    this.#activeToken = token;

    const loadRows = (state: State) =>
      this.#activeToken === token ? this.#loadRows(state) : Promise.resolve(undefined);
    // Returning undefined is how a superseded load declines to write: FetchHandler guards
    // its assignment with `if (data)`. The library's types say Promise<T[]> and don't
    // express that, so the cast is load-bearing - see
    // @vincjo/datatables/dist/src/server/handlers/FetchHandler.svelte.js `trigger()`.
    this.table.load(loadRows as (state: State) => Promise<SearchResult[]>);

    return () => {
      if (this.#activeToken === token) this.#teardown();
    };
  }

  #criteriaChanged() {
    if (!this.#activeToken) return;
    this.#supersedeConcepts();
    this.#loading = true;
    if (!this.#resetting) this.table.setPage(1);
  }

  #settle(outcome: SearchOutcome) {
    const waiters = this.#settleWaiters;
    this.#settleWaiters = [];
    waiters.forEach((resolve) => resolve(outcome));
  }

  #supersedeConcepts() {
    this.#conceptController?.abort();
    this.#conceptController = undefined;
    this.#conceptGeneration++;
  }

  #teardown() {
    this.#activeToken = null;
    this.#supersedeConcepts();
    this.#facetController?.abort();
    this.#facetController = undefined;
    this.#facetGeneration++;
    this.#previousCriteria = null;
    this.#lastAutoOpened = null;
    this.#facetCategories = undefined;
    this.#facetsFailed = false;
    if (this.#table) {
      this.#table.rows = [];
      this.#table.totalRows = 0;
    }
    this.#error = '';
    this.#loading = false;
    this.#settle('cancelled');
  }

  async #loadRows(state: State): Promise<SearchResult[] | undefined> {
    const term = this.#term;
    const facets = this.#selectedFacets;
    this.#conceptController?.abort();
    this.#conceptController = new AbortController();
    const generation = ++this.#conceptGeneration;
    const signal = this.#conceptController.signal;
    this.#loading = true;
    this.#error = '';
    if (this.#tour && (term || facets.length > 0)) {
      this.#tour = false;
    }
    try {
      const key = criteriaKey(term, facets);
      // Starts null so the first load refetches: a bare /explorer visit has empty criteria
      // but still needs the unfiltered facet list.
      if (key !== this.#previousCriteria) {
        this.#previousCriteria = key;
        this.#loadFacets(term, facets, key);
      }
      return await this.#search(state, term, facets, generation, signal);
    } catch {
      return undefined;
    } finally {
      if (generation === this.#conceptGeneration) {
        this.#loading = false;
        this.#settle(this.#error ? 'failed' : 'loaded');
      }
    }
  }

  #loadFacets(term: string, facets: Facet[], key: string) {
    const generation = ++this.#facetGeneration;
    this.#facetController?.abort();
    const controller = new AbortController();
    this.#facetController = controller;
    this.#facetsFailed = false;
    searchFacets(term, facets, { signal: controller.signal }).then(
      (response) => {
        if (generation === this.#facetGeneration) this.#commitFacets(response);
      },
      (e) => {
        if (isAbortError(e) || generation !== this.#facetGeneration) return;
        this.#facetsFailed = true;
        // Rolled back so the next load retries: `key` was recorded before the request
        // resolved, so unchanged criteria would otherwise never refetch.
        if (this.#previousCriteria === key) this.#previousCriteria = null;
      },
    );
  }

  #commitFacets(response: DictionaryFacetResult[]) {
    const hidden = zeroCountFacets(response);
    console.debug('Found the following facets that should be hidden:', JSON.stringify(hidden));
    this.#hiddenFacets = hidden;
    const nonZero = response
      .filter((category) => category.facets.some((facet) => facet.count > 0))
      .map((category) => category.name);
    // Re-applying the same set would reopen categories the user collapsed.
    const autoOpenKey = JSON.stringify([...nonZero].sort());
    if (autoOpenKey !== this.#lastAutoOpened) {
      this.#lastAutoOpened = autoOpenKey;
      this.#openFacets = nonZero;
    }
    this.#refreshSelectedCounts(response);
    this.#facetCategories = response;
  }

  // A selected top-level facet takes its count from the latest response, or 0 when the response
  // no longer lists it. The sidebar shows that count and toggleFacets sorts by it. Children keep
  // the count they were selected with.
  #refreshSelectedCounts(response: DictionaryFacetResult[]) {
    let changed = false;
    const next = this.#selectedFacets.map((selected) => {
      const category = response.find((c) => c.name === selected.category);
      const isChild = category?.facets.some((f) =>
        f.children?.some((child) => child.name === selected.name),
      );
      if (!category || isChild) return selected;
      const count = category.facets.find((f) => f.name === selected.name)?.count || 0;
      if (count === selected.count) return selected;
      changed = true;
      return { ...selected, count };
    });
    if (changed) this.#selectedFacets = next;
  }

  async #search(
    state: State,
    term: string,
    facets: Facet[],
    generation: number,
    signal: AbortSignal,
  ): Promise<SearchResult[] | undefined> {
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
    const response = await searchDictionary(
      term.trim(),
      facets,
      { pageNumber: state.currentPage - 1, pageSize: state.rowsPerPage },
      { signal },
    ).catch((e) => {
      if (!isAbortError(e) && generation === this.#conceptGeneration) {
        console.error(e);
        state.setTotalRows(0);
        this.#error = SEARCH_ERROR;
      }
      throw e;
    });

    if (generation !== this.#conceptGeneration) return undefined;

    if (!response) this.#error = SEARCH_ERROR;
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
}

export const explorerSearch = new ExplorerSearch();

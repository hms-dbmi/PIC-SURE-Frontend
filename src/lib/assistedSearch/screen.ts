import { get } from 'svelte/store';

import { QueryV3 } from '$lib/models/query/Query';
import { exports } from '$lib/stores/Export';
import { filterTree, genomicFilters, setFilterTree } from '$lib/stores/Filter';
import { facetsPromise } from '$lib/stores/Dictionary';
import { searchTerm, selectedFacets } from '$lib/stores/Search';
import {
  buildGenomicFiltersFromFilters,
  buildPhenotypicClauseFromTree,
} from '$lib/utilities/QueryBuilder';
import { loadQuerySummaryData } from '$lib/components/query/QueryConverters';

import { resolveFacets, toSlimFacets } from './model/facets';
import type { ChatQuery, ScreenState } from './model/types';

/** The researcher's screen as the AI service sees it: filters become a query, facets are slimmed. */
export function readScreen(): ScreenState {
  return {
    query: {
      select: get(exports).map((e) => e.conceptPath),
      phenotypicClause: buildPhenotypicClauseFromTree(get(filterTree)),
      genomicFilters: buildGenomicFiltersFromFilters(get(genomicFilters)),
    },
    facets: toSlimFacets(get(selectedFacets)),
    search: get(searchTerm),
  };
}

// Built before anything is set, so a concept that cannot be looked up leaves the screen untouched.
async function queryToStores(query: ChatQuery) {
  const data = loadQuerySummaryData(QueryV3.fromSerialized(query));
  const [tree, genomic, selected, errors] = await Promise.all([
    data.filterTree,
    data.genomicFilters,
    data.exports,
    data.errors,
  ]);
  if (errors.length) throw new Error(`Could not load: ${errors.join(', ')}`);
  return () => {
    setFilterTree(tree);
    genomicFilters.set(genomic);
    exports.set(selected);
  };
}

/** Sets each part present in `parts`, whole. The stores' own subscribers re-run the search. */
export async function applyScreen(parts: Partial<ScreenState>): Promise<void> {
  const setQuery = parts.query ? await queryToStores(parts.query) : undefined;
  const facets = parts.facets
    ? resolveFacets(parts.facets, await get(facetsPromise).catch(() => []))
    : undefined;

  setQuery?.();
  if (facets) selectedFacets.set(facets);
  if (parts.search !== undefined) searchTerm.set(parts.search);
}

/** Calls `onchange` whenever a store behind the screen is set; returns the stop. */
export function watchScreen(onchange: () => void): () => void {
  const stops = [exports, filterTree, genomicFilters, selectedFacets, searchTerm].map((store) => {
    let first = true;
    return store.subscribe(() => {
      // subscribe reports the current value at once, which is not a change
      if (first) first = false;
      else onchange();
    });
  });
  return () => stops.forEach((stop) => stop());
}

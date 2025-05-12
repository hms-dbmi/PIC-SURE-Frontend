import { get, writable, type Writable } from 'svelte/store';

import { TableHandler, type State } from '@vincjo/datatables/server';

import { type Facet, type SearchResult } from '$lib/models/Search';
import type { DictionaryConceptResult } from '$lib/models/api/DictionaryResponses';
import { searchDictionary } from '$lib/stores/Dictionary';
import { updateFacetsFromSearch, facetsPromise } from '$lib/stores/Dictionary';
import { getDefaultRows } from '$lib/components/datatable/stores';

export const loading: Writable<boolean> = writable(false);
export const searchPromise: Writable<Promise<DictionaryConceptResult | undefined>> = writable(
  Promise.resolve(undefined),
);
export const searchTerm: Writable<string> = writable('');
export const selectedFacets: Writable<Facet[]> = writable([]);
export const tableHandler: TableHandler = new TableHandler([] as SearchResult[], {
  rowsPerPage: getDefaultRows('ExplorerTable'),
});
export const tour: Writable<boolean> = writable(true);
export const error: Writable<string> = writable('');

selectedFacets.subscribe(() => {
  tableHandler.setPage(1);
});

searchTerm.subscribe(() => {
  tableHandler.setPage(1);
});

tableHandler.load(async (state: State) => {
  const term = get(searchTerm);
  const facets = get(selectedFacets);
  loading.set(true);
  if (get(tour) && (term || facets.length > 0)) {
    tour.set(false);
  }
  try {
    facetsPromise.set(updateFacetsFromSearch());
    return await search(state);
  } catch (e) {
    return [];
  } finally {
    loading.set(false);
  }
});

export async function search(state: State): Promise<SearchResult[]> {
  const errorText =
    'An error occurred while searching. If the problem persists, please contact an administrator.';
  const facets = get(selectedFacets);
  const term = get(searchTerm);
  if (!term && !facets.length) {
    state.setTotalRows(0);
    return [];
  }
  const search = searchDictionary(term.trim(), facets, {
    pageNumber: state.currentPage - 1,
    pageSize: state.rowsPerPage,
  });
  searchPromise.set(search);
  const response = await search.catch((e) => {
    console.error(e);
    state.setTotalRows(0);
    error.set(errorText);
    throw e;
  });

  if (!response) {
    error.set(errorText);
  }
  state.setTotalRows(response?.totalElements ?? 0);
  return response?.content ?? [];
}

async function updateFacets(facetsToUpdate: Facet[]) {
  const currentFacets = get(selectedFacets);
  facetsToUpdate.forEach((facet) => {
    const facetIndex = currentFacets.findIndex((f) => f.name === facet.name);
    if (facetIndex !== -1) {
      currentFacets.splice(facetIndex, 1);
    } else {
      currentFacets.push(facet);
    }
  });

  selectedFacets.set(currentFacets.sort((a, b) => b.count - a.count));
}

export function resetSearch() {
  searchTerm.set('');
  selectedFacets.set([]);
  error.set('');
  tour.set(true);
}

export default {
  selectedFacets,
  searchTerm,
  error,
  search,
  updateFacets,
  resetSearch,
};

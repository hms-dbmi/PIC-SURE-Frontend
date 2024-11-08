import { get, writable, type Writable } from 'svelte/store';
import { type Facet, type SearchResult } from '$lib/models/Search';
import type { DictionaryConceptResult } from '$lib/models/api/DictionaryResponses';
import type { State } from '@vincjo/datatables/remote';
import { searchDictionary } from '$lib/services/dictionary';

export const loading: Writable<Promise<DictionaryConceptResult | undefined>> = writable(
  Promise.resolve(undefined),
);
export const searchTerm: Writable<string> = writable('');
export const selectedFacets: Writable<Facet[]> = writable([]);
export const error: Writable<string> = writable('');

async function search(searchTerm: string, facets: Facet[], state?: State): Promise<SearchResult[]> {
  if (!searchTerm && (!facets || !facets.length)) {
    state?.setTotalRows(0);
    return [];
  }
  try {
    const search = searchDictionary(searchTerm.trim(), facets, {
      pageNumber: state?.pageNumber ? state?.pageNumber - 1 : 0,
      pageSize: state?.rowsPerPage,
    });
    loading.set(search);
    const response = await search;
    state?.setTotalRows(response.totalElements);
    return response.content;
  } catch (e) {
    console.error(e);
    error.set(
      'An error occurred while searching. If the problem persists, please contact an administrator.',
    );
    state?.setTotalRows(0);
    return [];
  }
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
}

export default {
  selectedFacets,
  searchTerm,
  error,
  search,
  updateFacets,
  resetSearch,
};

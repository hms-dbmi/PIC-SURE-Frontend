import { get, writable, type Writable } from 'svelte/store';
import { type Facet, type SearchResult } from '$lib/models/Search';
import type { DictionaryFacetResult } from '$lib/models/api/DictionaryResponses';
import type { State } from '@vincjo/datatables/remote';
import { searchDictionary } from '$lib/services/dictionary';

const searchTerm: Writable<string> = writable('');
const selectedFacets: Writable<Facet[]> = writable([]);
const error: Writable<string> = writable('');

async function search(searchTerm: string, facets: Facet[], state?: State): Promise<SearchResult[]> {
  if (!searchTerm && (!facets || !facets.length)) {
    state?.setTotalRows(0);
    return [];
  }
  try {
    const response = await searchDictionary(searchTerm.trim(), facets, {
      pageNumber: state?.pageNumber ? state?.pageNumber - 1 : 0,
      pageSize: state?.rowsPerPage,
    });
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

async function updateFacet(newFacet: Facet, facetCategory: DictionaryFacetResult | undefined) {
  if (facetCategory) {
    newFacet.categoryRef = {
      display: facetCategory.display,
      name: facetCategory.name,
      description: facetCategory.description,
    };
  }
  try {
    selectedFacets.update((facets) => {
      const index = facets.findIndex((facet) => facet.name === newFacet.name);
      if (index === -1) {
        facets.push(newFacet);
      } else {
        facets.splice(index, 1);
      }
      //For reactivity and sorting
      selectedFacets.set(get(selectedFacets).sort((a, b) => b.count - a.count));
      return facets;
    });
  } catch (e) {
    console.error(e);
    return;
  }
}

export default {
  selectedFacets,
  searchTerm,
  error,
  search,
  updateFacet,
};

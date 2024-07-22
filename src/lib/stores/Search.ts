import { get, writable, type Writable } from 'svelte/store';

import { type Facet, type SearchResult } from '$lib/models/Search';

import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
} from '$lib/models/api/DictionaryResponses';
import { searchDictionary } from '$lib/services/dictionary';

const searchTerm: Writable<string> = writable('');
const searchResults: Writable<SearchResult[]> = writable([]);
const selectedFacets: Writable<Facet[]> = writable([]);

async function search(search: string, page: number = 0, pageSize: number = 10) {
  const selectedFacetsToUse = get(selectedFacets);
  if (!search && selectedFacetsToUse.length === 0) {
    searchResults.set([]);
    searchTerm.set('');
    return;
  }
  const response: DictionaryConceptResult = await searchDictionary(search, selectedFacetsToUse, {
    pageNumber: page,
    pageSize: pageSize,
  });
  //response = await api.post(`${searchUrl}?page=${page}&page_size=${pageSize}`, { facets: [], search });
  searchResults.set(response.content);
  searchTerm.set(search);
  return response;
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
  subscribe: searchResults.subscribe,
  selectedFacets: selectedFacets,
  searchTerm,
  searchResults,
  search,
  updateFacet: updateFacet,
};

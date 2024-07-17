import * as api from '$lib/api';
import type { Facet } from '$lib/models/Search';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
} from '$lib/models/api/DictionaryResponses';
import type { Pageable } from '$lib/models/api/Pageable';

const dictionaryUrl = 'picsure/proxy/dictionary-api/';
const searchUrl = 'picsure/proxy/dictionary-api/concepts';

// TODO: facets pagination

export function searchDictionary(
  searchTerm = '',
  facets: Facet[],
  pageable: Pageable,
): Promise<DictionaryConceptResult> {
  return api.post(
    `${searchUrl}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    {
      facets,
      search: searchTerm,
    },
  );
}

export function getAllFacets(): Promise<DictionaryFacetResult[]> {
  const facetRequest = {
    //todo make real types
    facets: [],
    search: '',
  };
  return api.post(`${dictionaryUrl}facets/`, facetRequest);
}

export function updateFacetsFromSearch(search: string, facets: Facet[]) {
  const facetRequest = {
    //todo make real types
    facets: facets,
    search: search,
  };
  return api.post(`${dictionaryUrl}facets/`, facetRequest);
}

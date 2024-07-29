import * as api from '$lib/api';
import type { Facet, SearchResult } from '$lib/models/Search';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
} from '$lib/models/api/DictionaryResponses';
import type { Pageable } from '$lib/models/api/Pageable';

const dictionaryUrl = 'picsure/proxy/dictionary-api/';
const searchUrl = 'picsure/proxy/dictionary-api/concepts';
const conceptDetailUrl = 'picsure/proxy/dictionary-api/concepts/detail/';

const dictonaryCacheMap = new Map<string, SearchResult>();
let allFacetsCache: DictionaryFacetResult[];

function cacheResult(key: string, value: SearchResult) {
  if (!key || !value) return;
  if (dictonaryCacheMap.size > 100) {
    dictonaryCacheMap.clear();
  }
  dictonaryCacheMap.set(key, value);
}

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

export async function getAllFacets(): Promise<DictionaryFacetResult[]> {
  const facetRequest = {
    facets: [],
    search: '',
  };
  if (allFacetsCache) {
    return allFacetsCache;
  }
  const response = await api.post(`${dictionaryUrl}facets/`, facetRequest);
  allFacetsCache = response;
  return response;
}

export function updateFacetsFromSearch(
  search: string,
  facets: Facet[],
): Promise<DictionaryFacetResult[]> {
  const facetRequest = {
    facets: facets,
    search: search,
  };
  return api.post(`${dictionaryUrl}facets/`, facetRequest);
}

export async function getConceptDetails(
  conceptPath: string,
  dataset: string,
): Promise<SearchResult> {
  const url = `${conceptDetailUrl}${dataset}`;

  if (dictonaryCacheMap.has(url)) {
    return dictonaryCacheMap.get(url) as SearchResult;
  }

  const response: SearchResult = await api.post(
    url,
    String.raw`${conceptPath.replace(/\\\\/g, '\\')}`,
  );

  if (!response) {
    throw new Error('No response');
  }

  cacheResult(url, response);
  return response;
}

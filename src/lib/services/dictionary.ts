import * as api from '$lib/api';
import type { Facet, SearchResult } from '$lib/models/Search';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
} from '$lib/models/api/DictionaryResponses';
import type { Pageable } from '$lib/models/api/Pageable';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';

const dictionaryUrl = 'picsure/proxy/dictionary-api/';
const searchUrl = 'picsure/proxy/dictionary-api/concepts';
const conceptDetailUrl = 'picsure/proxy/dictionary-api/concepts/detail/';

const dictonaryCacheMap = new Map<string, SearchResult>();

interface DictionarySearchRequest {
  facets: Facet[];
  search: string;
  consents?: string[];
}

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
  let request: DictionarySearchRequest = { facets, search: searchTerm };
  if (!get(page).url.pathname.includes('/discover')) {
    request = addConsents(request);
  }
  return api.post(
    `${searchUrl}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    request,
  );
}

export async function getAllFacets(): Promise<DictionaryFacetResult[]> {
  let request: DictionarySearchRequest = { facets: [], search: '' };
  if (!get(page).url.pathname.includes('/discover')) {
    request = addConsents(request);
  }
  const response = await api.post(`${dictionaryUrl}facets/`, request);
  return response;
}

export function updateFacetsFromSearch(
  search: string,
  facets: Facet[],
): Promise<DictionaryFacetResult[]> {
  let request: DictionarySearchRequest = { facets: facets, search: search };
  if (!get(page).url.pathname.includes('/discover')) {
    request = addConsents(request);
  }
  return api.post(`${dictionaryUrl}facets/`, request);
}

export async function getConceptDetails(
  conceptPath: string,
  dataset: string,
): Promise<SearchResult> {
  const url = `${conceptDetailUrl}${dataset}`;
  const rawConceptPath = String.raw`${conceptPath.replace(/\\\\/g, '\\')}`;

  if (dictonaryCacheMap.has(rawConceptPath)) {
    return dictonaryCacheMap.get(rawConceptPath) as SearchResult;
  }

  const response: SearchResult = await api.post(url, rawConceptPath);

  if (!response) {
    throw new Error('No response');
  }

  cacheResult(rawConceptPath, response);
  return response;
}

function addConsents(request: DictionarySearchRequest) {
  const queryTemplate = get(user)?.queryTemplate;
  if (queryTemplate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters = queryTemplate.categoryFilters as any;
    const consents = filters['\\_consents\\'] as string[];
    request.consents = consents;
  }
  return request;
}

export async function getConceptCount(isOpenAccess = false) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  let res = await api.post(`${searchUrl}?page_number=1&page_size=1`, request);
  return res.totalElements as number;
}

export async function getStudiesCount(isOpenAccess = false) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  let res: DictionaryFacetResult[] = await api.post(`${dictionaryUrl}facets/`, request);
  let facetCat = res.find((facetCat) => facetCat.name === 'dataset_id');
  if (!facetCat) {
    return 0;
  }
  if (isOpenAccess) {
    return facetCat.facets.length;
  }
  let facetsForUser = facetCat.facets.filter((facet) => facet.count > 0);
  return facetsForUser.length;
}


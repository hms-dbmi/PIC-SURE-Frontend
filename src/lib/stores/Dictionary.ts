import { get, writable, type Writable } from 'svelte/store';

import { page } from '$app/stores';

import * as api from '$lib/api';
import type { Facet, SearchResult } from '$lib/models/Search';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
} from '$lib/models/api/DictionaryResponses';
import type { Pageable } from '$lib/models/api/Pageable';
import { user } from '$lib/stores/User';
import { searchTerm, selectedFacets } from '$lib/stores/Search';

const DICT_URL = 'picsure/proxy/dictionary-api/';
const CONCEPT_URL = 'picsure/proxy/dictionary-api/concepts';
const CONCEPT_DETAIL_URL = 'picsure/proxy/dictionary-api/concepts/detail/';
const DATASET_DETAIL_URL = 'picsure/proxy/dictionary-api/dashboard-drawer/';

export type FacetSkeleton = {
  [facetCategory: string]: string[];
};
export const hiddenFacets: Writable<FacetSkeleton> = writable({});
export const facetsPromise: Writable<Promise<DictionaryFacetResult[]>> = writable(
  Promise.resolve([]),
);

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
    `${CONCEPT_URL}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    request,
  );
}

function initializeHiddenFacets(response: DictionaryFacetResult[]) {
  // facets that have a count of zero should never be shown in the UI
  // this happens because of consent filters
  const facetsWithZeroConcepts = response
    .map((cat) => {
      return {
        name: cat.name,
        values: cat.facets.filter((f) => f.count === 0).map((f) => f.name),
      };
    })
    .reduce((prev, cur) => {
      prev[cur.name] = cur.values;
      return prev;
    }, {} as FacetSkeleton);
  console.debug(
    'Found the following facets that should be hidden:',
    JSON.stringify(facetsWithZeroConcepts),
  );

  hiddenFacets.set(facetsWithZeroConcepts);
}

export async function updateFacetsFromSearch(): Promise<DictionaryFacetResult[]> {
  const search = get(searchTerm);
  const facets = get(selectedFacets);
  let request: DictionarySearchRequest = { facets: facets, search: search };
  if (!get(page).url.pathname.includes('/discover')) {
    request = addConsents(request);
  }

  try {
    const response: DictionaryFacetResult[] = await api.post(`${DICT_URL}facets/`, request);
    initializeHiddenFacets(response);
    processFacetResults(response);
    return response;
  } catch (error) {
    console.error('Failed to update facets from search:', error);
    throw error;
  }
}

// Adds references to parent and category
function processFacetResults(response: DictionaryFacetResult[]) {
  response.forEach((category) => {
    category.facets.forEach((facet) => {
      facet.categoryRef = {
        name: category.name,
        display: category.display,
        description: category.description,
      };
      if (facet.children?.length) {
        facet.children.forEach((child) => {
          child.categoryRef = {
            name: category.name,
            display: category.display,
            description: category.description,
          };
          child.parentRef = {
            name: facet.name,
            display: facet.display,
            description: facet.description,
          };
        });
      }
    });
  });
}

export async function getConceptDetails(
  conceptPath: string,
  dataset: string,
): Promise<SearchResult> {
  const url = `${CONCEPT_DETAIL_URL}${dataset}`;
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
    const filters = (queryTemplate.categoryFilters as any) || {};
    const consents = (filters['\\_consents\\'] as string[]) || [];
    request.consents = consents;
  }
  return request;
}

export async function getConceptCount(isOpenAccess = false) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  const res: DictionaryConceptResult = await api.post(
    `${CONCEPT_URL}?page_number=1&page_size=1`,
    request,
  );
  return res.totalElements || Promise.reject('total not found');
}

export async function getFacetCategoryCount(isOpenAccess = false, category: string) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  const res: DictionaryFacetResult[] = await api.post(`${DICT_URL}facets/`, request);
  const facetCat = res.find((facetCat) => facetCat.name === category);
  if (!facetCat) {
    return 0;
  }
  if (isOpenAccess) {
    return facetCat.facets.length;
  }
  const facetsForUser = facetCat.facets.filter((facet) => facet.count > 0);
  return facetsForUser.length;
}

export async function getDatasetDetails(datasetId: string) {
  return api.get(`${DATASET_DETAIL_URL}${datasetId}`);
}

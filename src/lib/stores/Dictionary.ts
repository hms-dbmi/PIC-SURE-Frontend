import { get, writable, type Writable } from 'svelte/store';

import { page } from '$app/state';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { Facet, SearchResult } from '$lib/models/Search';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
} from '$lib/models/api/Dictionary';
import type { Pageable } from '$lib/models/api/Pageable';
import { user } from '$lib/stores/User';
import { searchTerm, selectedFacets } from '$lib/stores/Search';

export type FacetSkeleton = {
  [facetCategory: string]: string[];
};
export const hiddenFacets: Writable<FacetSkeleton> = writable({});
export const facetsPromise: Writable<Promise<DictionaryFacetResult[]>> = writable(
  Promise.resolve([]),
);
export const openFacets: Writable<string[]> = writable([]);

const dictonaryCacheMap = new Map<string, SearchResult>();

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
  const request: DictionarySearchRequest = dictionaryRequest(
    page.url.pathname.includes('/discover'),
  );
  request.facets = facets;
  request.search = searchTerm;
  return api.post(
    `${Picsure.Concepts}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
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
  const request: DictionarySearchRequest = dictionaryRequest(
    page.url.pathname.includes('/discover'),
  );
  request.facets = get(selectedFacets);
  request.search = get(searchTerm);

  try {
    const response: DictionaryFacetResult[] = await api.post(Picsure.Facets, request);
    initializeHiddenFacets(response);
    processFacetResults(response);
    const nonZero = response
      .map((category) => (category.facets.some((facet) => facet.count > 0) ? category.name : ''))
      .filter((c) => c);
    openFacets.set(nonZero);
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
  const url = `${Picsure.Concept.Detail}/${dataset}`;
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

export function addConsents(request: DictionarySearchRequest) {
  const queryTemplate = get(user)?.queryTemplate;
  if (queryTemplate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters = (queryTemplate.categoryFilters as any) || {};
    const consents = (filters['\\_consents\\'] as string[]) || [];
    request.consents = consents;
  }
  return request;
}

export async function getDatasetDetails(datasetId: string) {
  return api.get(`${Picsure.DashboardDrawer}/${datasetId}`);
}

export async function getConceptTree(
  dataset: string,
  depth: number,
  conceptPath: string,
): Promise<SearchResult> {
  const url = `${Picsure.Concept.Tree}/${dataset}?depth=${depth}`;
  return api.post(url, conceptPath);
}

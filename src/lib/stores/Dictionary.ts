import { get, writable, type Writable } from 'svelte/store';

import { page } from '$app/state';

import * as api from '$lib/api';
import { isAbortError, type RequestOptions } from '$lib/api';
import { Picsure } from '$lib/paths';
import type { Facet, SearchResult } from '$lib/models/Search';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
} from '$lib/models/api/Dictionary';
import type { Pageable } from '$lib/models/api/Pageable';
import {
  ACCESS_UNAVAILABLE_MESSAGE,
  accessUnavailable,
  consentedStudies,
  consentsSettled,
  showAccessUnavailable,
} from '$lib/stores/User';
import { searchTerm, selectedFacets } from '$lib/stores/Search';
import { log, createLog } from '$lib/logger';

export type FacetSkeleton = {
  [facetCategory: string]: string[];
};
export const hiddenFacets: Writable<FacetSkeleton> = writable({});
export const facetsPromise: Writable<Promise<DictionaryFacetResult[]>> = writable(
  Promise.resolve([]),
);
export const openFacets: Writable<string[]> = writable([]);

let lastAutoOpened: string | null = null;

export function resetFacetState() {
  lastAutoOpened = null;
}

const dictonaryCacheMap = new Map<string, SearchResult>();
export const ENSURE_MAX_DEPTH = 100;

function cacheResult(key: string, value: SearchResult) {
  if (!key || !value) return;
  if (dictonaryCacheMap.size > 100) {
    dictonaryCacheMap.clear();
  }
  dictonaryCacheMap.set(key, value);
}

export async function searchDictionary(
  searchTerm = '',
  facets: Facet[],
  pageable: Pageable,
  options?: RequestOptions,
): Promise<DictionaryConceptResult> {
  let request: DictionarySearchRequest = { facets, search: searchTerm };
  // Discover is open access, so there are no consents to add and no token to send.
  const onDiscover = page.url.pathname.includes('/discover');
  if (!onDiscover) {
    request = await addConsents(request);
  }
  return api.post(
    `${Picsure.Concepts}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    request,
    undefined,
    !onDiscover,
    options,
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

export async function updateFacetsFromSearch(
  options?: RequestOptions & { isCurrent?: () => boolean },
): Promise<DictionaryFacetResult[]> {
  const search = get(searchTerm);
  const facets = get(selectedFacets);
  let request: DictionarySearchRequest = { facets: facets, search: search };
  // /dictionary/facets serves open and authorized traffic on one URL, so this decides openness, not the gateway.
  const onDiscover = page.url.pathname.includes('/discover');
  if (!onDiscover) {
    request = await addConsents(request);
  }

  try {
    log(createLog('SEARCH', 'facets.load', { search, facets }));
    const response: DictionaryFacetResult[] = await api.post(
      Picsure.Facets,
      request,
      undefined,
      !onDiscover,
      { signal: options?.signal },
    );
    if (options?.isCurrent && !options.isCurrent()) {
      return response;
    }
    initializeHiddenFacets(response);
    processFacetResults(response);
    const nonZero = response
      .map((category) => (category.facets.some((facet) => facet.count > 0) ? category.name : ''))
      .filter((c) => c);
    // Re-applying the same set would reopen categories the user collapsed.
    const autoOpenKey = JSON.stringify([...nonZero].sort());
    if (autoOpenKey !== lastAutoOpened) {
      lastAutoOpened = autoOpenKey;
      openFacets.set(nonZero);
    }
    return response;
  } catch (error) {
    if (!isAbortError(error)) {
      console.error('Failed to update facets from search:', error);
    }
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

export async function getHierarchyConcepts(
  dataset: string,
  conceptPath: string,
): Promise<SearchResult[]> {
  const response: SearchResult[] = await api.post(
    `${Picsure.Concept.Hierarchy}/${dataset}`,
    conceptPath,
  );

  if (!response) {
    throw new Error('No response');
  }

  return response;
}

/**
 * Waits for access rather than sending an empty list before it lands - the dictionary reads an
 * empty list as no filter and answers with every concept. Throws for the same reason when
 * access is unknown. An empty list once access HAS loaded is deliberate and must stay
 * permitted: it means the deployment has no consent model. BdcConsentsBuilder throws rather
 * than emitting an empty `\_consents\`, so a consent-based deployment cannot reach here empty.
 */
export async function addConsents(request: DictionarySearchRequest) {
  await consentsSettled();
  if (get(accessUnavailable)) {
    // Raised here because Search.ts swallows this error in one path and replaces it with its
    // own generic text in the other, and a reload has no login-time toast to fall back on.
    showAccessUnavailable();
    throw new Error(ACCESS_UNAVAILABLE_MESSAGE);
  }
  request.consents = get(consentedStudies);
  return request;
}

export async function getConceptCount(isOpenAccess = false) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = await addConsents(request);
  }
  const res: DictionaryConceptResult = await api.post(
    `${Picsure.Concepts}?page_number=1&page_size=1`,
    request,
    undefined,
    !isOpenAccess,
  );
  return res.totalElements || Promise.reject('total not found');
}

export async function getFacetCategoryCount(isOpenAccess = false, category: string) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = await addConsents(request);
  }
  const res: DictionaryFacetResult[] = await api.post(
    Picsure.Facets,
    request,
    undefined,
    !isOpenAccess,
  );
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

export async function getInitialTree(depth: number = 1): Promise<SearchResult[]> {
  if (depth > ENSURE_MAX_DEPTH) {
    depth = ENSURE_MAX_DEPTH;
  }
  return api.get(`${Picsure.Concept.Tree}?depth=${depth}`);
}

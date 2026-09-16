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
  if (!page.url.pathname.includes('/discover')) {
    request = await addConsents(request);
  }
  return api.post(
    `${Picsure.Concepts}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    request,
    undefined,
    undefined,
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
  if (!page.url.pathname.includes('/discover')) {
    request = await addConsents(request);
  }

  try {
    log(createLog('SEARCH', 'facets.load', { search, facets }));
    const response: DictionaryFacetResult[] = await api.post(
      Picsure.Facets,
      request,
      undefined,
      undefined,
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

/**
 * Escapes a dataset for the request path it is about to be interpolated into.
 *
 * Load-bearing, not tidiness. `api.send` resolves its path against
 * `window.location.origin`, so `fetch` normalises the result: `..` segments in a dataset walk
 * out of the dictionary namespace and aim an authenticated, token-bearing POST - carrying a
 * caller-supplied string body - at whatever same-origin endpoint the path lands on.
 * `picsure/dictionary/concepts/detail/../../../../psama/studyAccess` resolves to
 * `/psama/studyAccess`, which is exactly the URL, method and body shape of
 * `addManualRole()`. `\` is a path separator to the URL parser too, so it is not only `/`.
 *
 * Escaping an ordinary dataset name is a no-op. Routes that take a dataset from the URL
 * constrain it as well (`$lib/explorer/variableUrl`); the two checks fail independently and
 * this is the one that covers every caller.
 */
const DOT_SEGMENT_PROBE = 'http://probe.invalid/a/b/';

function datasetSegment(dataset: string): string {
  const segment = encodeURIComponent(dataset);
  // Escaping is not enough on its own for `.` and `..`: the URL parser reads `%2E` as `.`,
  // so an encoded dot segment still normalises away and walks the request up a level. No
  // encoding fixes that, so refuse to build the path at all. Without this the check above
  // would be leaning on the variable detail route's own validation to cover one input class,
  // and the point of this boundary is that it holds when the other one is not there.
  if (new URL(segment, DOT_SEGMENT_PROBE).pathname !== `/a/b/${segment}`) {
    throw new Error('Refusing to build a dictionary request path from a relative dataset');
  }
  return segment;
}

export async function getConceptDetails(
  conceptPath: string,
  dataset: string,
): Promise<SearchResult> {
  const url = `${Picsure.Concept.Detail}/${datasetSegment(dataset)}`;
  const rawConceptPath = String.raw`${conceptPath.replace(/\\\\/g, '\\')}`;
  // Keyed on both halves. The same concept path exists under more than one dataset, and a
  // path-only key answers a request for one dataset's concept with another's - so a URL
  // naming dataset B would render dataset A's variable, hierarchy and filters.
  const cacheKey = JSON.stringify([dataset, rawConceptPath]);

  if (dictonaryCacheMap.has(cacheKey)) {
    return dictonaryCacheMap.get(cacheKey) as SearchResult;
  }

  const response: SearchResult = await api.post(url, rawConceptPath);

  if (!response) {
    throw new Error('No response');
  }

  cacheResult(cacheKey, response);
  return response;
}

export async function getHierarchyConcepts(
  dataset: string,
  conceptPath: string,
): Promise<SearchResult[]> {
  const response: SearchResult[] = await api.post(
    `${Picsure.Concept.Hierarchy}/${datasetSegment(dataset)}`,
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
  );
  return res.totalElements || Promise.reject('total not found');
}

export async function getFacetCategoryCount(isOpenAccess = false, category: string) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = await addConsents(request);
  }
  const res: DictionaryFacetResult[] = await api.post(Picsure.Facets, request);
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
  return api.get(`${Picsure.DashboardDrawer}/${datasetSegment(datasetId)}`);
}

export async function getConceptTree(
  dataset: string,
  depth: number,
  conceptPath: string,
): Promise<SearchResult> {
  const url = `${Picsure.Concept.Tree}/${datasetSegment(dataset)}?depth=${depth}`;
  return api.post(url, conceptPath);
}

export async function getInitialTree(depth: number = 1): Promise<SearchResult[]> {
  if (depth > ENSURE_MAX_DEPTH) {
    depth = ENSURE_MAX_DEPTH;
  }
  return api.get(`${Picsure.Concept.Tree}?depth=${depth}`);
}

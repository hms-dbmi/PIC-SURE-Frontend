import { get, writable, type Writable } from 'svelte/store';

import { page } from '$app/state';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import type { Facet, FacetFilter, SearchResult } from '$lib/models/Search';
import type {
  ConceptPathRequest,
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
} from '$lib/models/api/Dictionary';
import type { Pageable } from '$lib/models/api/Pageable';
import { user } from '$lib/stores/User';
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

const dictonaryCacheMap = new Map<string, SearchResult>();
export const ENSURE_MAX_DEPTH = 100;

function cacheResult(key: string, value: SearchResult) {
  if (!key || !value) return;
  if (dictonaryCacheMap.size > 100) {
    dictonaryCacheMap.clear();
  }
  dictonaryCacheMap.set(key, value);
}

/**
 * Narrows selected facets to the `(name, category)` pair the server filters on.
 *
 * The facets we hold in `selectedFacets` came from `POST /dictionary/facets`
 * and have since been decorated with `categoryRef` / `parentRef` by
 * `processFacetResults` for the UI's benefit. The dictionary service binds
 * strictly and its nested `Facet` record rejects unknown members, so sending
 * one back untouched is a 400 on every search that has a facet selected. The
 * rest of a response facet — display, description, count, children — has no
 * meaning as a filter anyway.
 *
 * Every outbound `DictionarySearchRequest` must route its facets through here.
 */
export function toFacetFilter(facets: Facet[] = []): FacetFilter[] {
  return facets.map(({ name, category }) => ({ name, category }));
}

export function searchDictionary(
  searchTerm = '',
  facets: Facet[],
  pageable: Pageable,
): Promise<DictionaryConceptResult> {
  let request: DictionarySearchRequest = { facets: toFacetFilter(facets), search: searchTerm };
  if (!page.url.pathname.includes('/discover')) {
    request = addConsents(request);
  }
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
  const search = get(searchTerm);
  const facets = get(selectedFacets);
  let request: DictionarySearchRequest = { facets: toFacetFilter(facets), search: search };
  if (!page.url.pathname.includes('/discover')) {
    request = addConsents(request);
  }

  try {
    log(createLog('SEARCH', 'facets.load', { search, facets }));
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

  // A ConceptPathRequest object, not the raw path as the whole body: the
  // backslashes have to be JSON-escaped, which JSON.stringify does for us.
  const body: ConceptPathRequest = { conceptPath: rawConceptPath };
  const response: SearchResult = await api.post(url, body);

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
  const body: ConceptPathRequest = { conceptPath };
  const response: SearchResult[] = await api.post(`${Picsure.Concept.Hierarchy}/${dataset}`, body);

  if (!response) {
    throw new Error('No response');
  }

  return response;
}

let warnedAboutMalformedConsents = false;

/**
 * Copies the user's consent list out of their query template onto the request.
 *
 * `consents` binds to `List<String>` on the server, which binds strictly: a
 * template carrying anything else under `\_consents\` — an object, a list of
 * numbers, a bare string — is a 400 on every dictionary call, including the
 * ones the dashboard fires on first paint. A malformed template is a data
 * problem we cannot fix from here, so we omit the field and let the request
 * succeed unfiltered rather than fail outright.
 */
export function addConsents(request: DictionarySearchRequest) {
  const queryTemplate = get(user)?.queryTemplate;
  if (queryTemplate) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters = (queryTemplate.categoryFilters as any) || {};
    const consents = filters['\\_consents\\'];
    if (consents === undefined || consents === null) {
      request.consents = [];
    } else if (Array.isArray(consents) && consents.every((c) => typeof c === 'string')) {
      request.consents = consents;
    } else {
      delete request.consents;
      if (!warnedAboutMalformedConsents) {
        warnedAboutMalformedConsents = true;
        console.warn(
          'Query template has a malformed `\\_consents\\` category filter (expected an array of ' +
            'strings); omitting consents from dictionary requests.',
          consents,
        );
      }
    }
  }
  return request;
}

export async function getConceptCount(isOpenAccess = false) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  const res: DictionaryConceptResult = await api.post(
    `${Picsure.Concepts}?page_number=1&page_size=1`,
    request,
  );
  return res.total || Promise.reject('total not found');
}

export async function getFacetCategoryCount(isOpenAccess = false, category: string) {
  let request: DictionarySearchRequest = { facets: [], search: '', consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
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
  return api.get(`${Picsure.DashboardDrawer}/${datasetId}`);
}

export async function getConceptTree(
  dataset: string,
  depth: number,
  conceptPath: string,
): Promise<SearchResult> {
  const url = `${Picsure.Concept.Tree}/${dataset}?depth=${depth}`;
  const body: ConceptPathRequest = { conceptPath };
  return api.post(url, body);
}

export async function getInitialTree(depth: number = 1): Promise<SearchResult[]> {
  if (depth > ENSURE_MAX_DEPTH) {
    depth = ENSURE_MAX_DEPTH;
  }
  return api.get(`${Picsure.Concept.Tree}?depth=${depth}`);
}

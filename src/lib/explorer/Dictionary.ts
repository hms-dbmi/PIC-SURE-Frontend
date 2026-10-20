import { get } from 'svelte/store';

import * as dictionary from '#lib/api/picsure/dictionary.ts';
import { isAbortError } from '#lib/api/errors.ts';
import type { Facet, SearchResult } from '#lib/explorer/types.ts';
import type {
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
} from '#lib/api/picsure/dictionary.types.ts';
import type { Pageable } from '#lib/api/picsure/pageable.types.ts';
import {
  ACCESS_UNAVAILABLE_MESSAGE,
  accessUnavailable,
  consentedStudies,
  consentsSettled,
  showAccessUnavailable,
} from '#lib/auth/User.ts';
import { exploreMode } from '#lib/explorer/mode.ts';
import { log, createLog } from '#lib/telemetry/logger.ts';

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
  options?: { signal?: AbortSignal },
): Promise<DictionaryConceptResult> {
  let request: DictionarySearchRequest = { facets, search: searchTerm };
  if (exploreMode() !== 'discover') {
    request = await addConsents(request);
  }
  return dictionary.searchConcepts(request, pageable, { signal: options?.signal });
}

/** Facet categories for a search, each facet linked to its category and parent. */
export async function searchFacets(
  search: string,
  facets: Facet[],
  options?: { signal?: AbortSignal },
): Promise<DictionaryFacetResult[]> {
  let request: DictionarySearchRequest = { facets, search };
  if (exploreMode() !== 'discover') {
    request = await addConsents(request);
  }

  try {
    log(createLog('SEARCH', 'facets.load', { search, facets }));
    const response = await dictionary.searchFacets(request, { signal: options?.signal });
    processFacetResults(response);
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
  const rawConceptPath = String.raw`${conceptPath.replace(/\\\\/g, '\\')}`;

  if (dictonaryCacheMap.has(rawConceptPath)) {
    return dictonaryCacheMap.get(rawConceptPath) as SearchResult;
  }

  const response = await dictionary.getConceptDetail(dataset, rawConceptPath);

  cacheResult(rawConceptPath, response);
  return response;
}

export async function getHierarchyConcepts(
  dataset: string,
  conceptPath: string,
): Promise<SearchResult[]> {
  return dictionary.getConceptHierarchy(dataset, conceptPath);
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
    // Raised here because ExplorerSearch swallows this error in one path and replaces it with
    // its own generic text in the other, and a reload has no login-time toast to fall back on.
    showAccessUnavailable();
    throw new Error(ACCESS_UNAVAILABLE_MESSAGE);
  }
  request.consents = get(consentedStudies);
  return request;
}

export async function getConceptTree(
  dataset: string,
  depth: number,
  conceptPath: string,
): Promise<SearchResult> {
  return dictionary.getConceptTree(dataset, depth, conceptPath);
}

export async function getInitialTree(depth: number = 1): Promise<SearchResult[]> {
  if (depth > ENSURE_MAX_DEPTH) {
    depth = ENSURE_MAX_DEPTH;
  }
  return dictionary.getRootConceptTrees(depth);
}

import { request, type Auth } from '#lib/api/client.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import type { SearchResult } from '#lib/explorer/types.ts';
import type {
  DashboardResponse,
  DatasetDetails,
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
  GeneSearchPage,
} from '#lib/api/picsure/dictionary.types.ts';
import type { Pageable } from '#lib/api/picsure/pageable.types.ts';

interface Options {
  signal?: AbortSignal;
  /** `anonymous` for the open variant's counts on the discover pages. */
  auth?: Extract<Auth, 'open' | 'anonymous'>;
}

export function searchConcepts(
  search: DictionarySearchRequest,
  page: Pick<Pageable, 'pageNumber' | 'pageSize'>,
  { signal, auth = 'open' }: Options = {},
): Promise<DictionaryConceptResult> {
  return request(Picsure.Concepts, {
    method: 'POST',
    query: { page_number: page.pageNumber, page_size: page.pageSize },
    body: search,
    auth,
    signal,
  });
}

export function searchFacets(
  search: DictionarySearchRequest,
  { signal, auth = 'open' }: Options = {},
): Promise<DictionaryFacetResult[]> {
  return request(Picsure.Facets, { method: 'POST', body: search, auth, signal });
}

// The concept path is the whole body, sent as a bare string.
export function getConceptDetail(dataset: string, conceptPath: string): Promise<SearchResult> {
  return request(PicsurePaths.conceptDetail(dataset), {
    method: 'POST',
    body: conceptPath,
    auth: 'open',
  });
}

export function getConceptHierarchy(dataset: string, conceptPath: string): Promise<SearchResult[]> {
  return request(PicsurePaths.conceptHierarchy(dataset), {
    method: 'POST',
    body: conceptPath,
    auth: 'open',
  });
}

export function getConceptTree(
  dataset: string,
  depth: number,
  conceptPath: string,
): Promise<SearchResult> {
  return request(PicsurePaths.conceptTree(dataset), {
    method: 'POST',
    query: { depth },
    body: conceptPath,
    auth: 'open',
  });
}

export function getRootConceptTrees(depth: number): Promise<SearchResult[]> {
  return request(Picsure.Concept.Tree, { query: { depth }, auth: 'open' });
}

export function getDashboard(): Promise<DashboardResponse> {
  return request(Picsure.Dashboard, { auth: 'open' });
}

export function getDatasetDetails(datasetId: string): Promise<DatasetDetails> {
  return request(PicsurePaths.dashboardDrawer(datasetId), { auth: 'open' });
}

/** One page of the genes that have variants, matching `search`. */
export async function searchGenes(
  search: string,
  page: number,
  size: number,
): Promise<GeneSearchPage> {
  const response = await request<unknown>(Picsure.SearchValues, {
    query: { genomicConceptPath: 'Gene_with_variant', query: search, page, size },
    headers: { 'content-type': 'application/json' },
    auth: 'open',
  });
  return toGeneSearchPage(response);
}

function toGeneSearchPage(response: unknown): GeneSearchPage {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid gene search response');
  }
  const { error, results, total, page } = response as Record<string, unknown>;
  // HPDS answers some failures with a 200 and an `error` field
  if (error) throw error;
  if (!Array.isArray(results) || typeof total !== 'number' || typeof page !== 'number') {
    throw new Error('Invalid gene search response');
  }
  return { results: results.filter((r): r is string => typeof r === 'string'), total, page };
}

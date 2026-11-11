import { request } from '#lib/api/client.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import type {
  SearchResult,
  DashboardResponse,
  DatasetDetails,
  DictionaryConceptResult,
  DictionaryFacetResult,
  DictionarySearchRequest,
  GeneSearchPage,
} from '#lib/api/picsure/dictionary.types.ts';
import type { Pageable } from '#lib/api/picsure/pageable.types.ts';
import { expectArray, expectRecord, isRecord } from '#lib/api/picsure/guards.ts';

interface Options {
  signal?: AbortSignal;
  /** See `RequestOptions.openAccess`. */
  openAccess?: boolean;
}

export async function searchConcepts(
  search: DictionarySearchRequest,
  page: Pick<Pageable, 'pageNumber' | 'pageSize'>,
  { signal, openAccess }: Options = {},
): Promise<DictionaryConceptResult> {
  const response = expectRecord(
    await request<unknown>(Picsure.Concepts, {
      method: 'POST',
      query: { page_number: page.pageNumber, page_size: page.pageSize },
      body: search,
      auth: 'open',
      openAccess,
      signal,
    }),
    'concept search',
  );
  // an answer without a content list is an empty page (the tour's search mocks send one)
  const content =
    response.content === undefined ? [] : expectArray(response.content, 'concept search');
  return { ...response, content } as unknown as DictionaryConceptResult;
}

export async function searchFacets(
  search: DictionarySearchRequest,
  { signal, openAccess }: Options = {},
): Promise<DictionaryFacetResult[]> {
  const categories = expectArray(
    await request<unknown>(Picsure.Facets, {
      method: 'POST',
      body: search,
      auth: 'open',
      openAccess,
      signal,
    }),
    'facet',
  );
  if (!categories.every((category) => isRecord(category) && Array.isArray(category.facets))) {
    throw new Error('Invalid facet response');
  }
  return categories as DictionaryFacetResult[];
}

// The concept path is the whole body, sent as a bare string.
export async function getConceptDetail(
  dataset: string,
  conceptPath: string,
): Promise<SearchResult> {
  return toConcept(
    await request(PicsurePaths.conceptDetail(dataset), {
      method: 'POST',
      body: conceptPath,
      auth: 'open',
    }),
    'concept detail',
  );
}

export async function getConceptHierarchy(
  dataset: string,
  conceptPath: string,
): Promise<SearchResult[]> {
  return toConcepts(
    await request(PicsurePaths.conceptHierarchy(dataset), {
      method: 'POST',
      body: conceptPath,
      auth: 'open',
    }),
    'concept hierarchy',
  );
}

export async function getConceptTree(
  dataset: string,
  depth: number,
  conceptPath: string,
): Promise<SearchResult> {
  return toConcept(
    await request(PicsurePaths.conceptTree(dataset), {
      method: 'POST',
      query: { depth },
      body: conceptPath,
      auth: 'open',
    }),
    'concept tree',
  );
}

export async function getRootConceptTrees(depth: number): Promise<SearchResult[]> {
  return toConcepts(
    await request(Picsure.Concept.Tree, { query: { depth }, auth: 'open' }),
    'concept tree',
  );
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = expectRecord(await request(Picsure.Dashboard, { auth: 'open' }), 'dashboard');
  expectArray(response.columns, 'dashboard');
  expectArray(response.rows, 'dashboard');
  return response as unknown as DashboardResponse;
}

export async function getDatasetDetails(datasetId: string): Promise<DatasetDetails> {
  return expectRecord(
    await request(PicsurePaths.dashboardDrawer(datasetId), { auth: 'open' }),
    'dataset details',
  );
}

// Concepts carry many optional, deployment-specific fields; the path is the one every caller needs.
function toConcept(value: unknown, what: string): SearchResult {
  const concept = expectRecord(value, what);
  if (typeof concept.conceptPath !== 'string') throw new Error(`Invalid ${what} response`);
  return concept as SearchResult;
}

function toConcepts(value: unknown, what: string): SearchResult[] {
  return expectArray(value, what).map((concept) => toConcept(concept, what));
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
  const { error, results, total, page } = expectRecord(response, 'gene search');
  // HPDS answers some failures with a 200 and an `error` field
  if (error) throw error;
  if (!Array.isArray(results) || typeof total !== 'number' || typeof page !== 'number') {
    throw new Error('Invalid gene search response');
  }
  return { results: results.filter((r): r is string => typeof r === 'string'), total, page };
}

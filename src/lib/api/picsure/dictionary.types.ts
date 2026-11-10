import { type SearchResult } from '#lib/explorer/types.ts';
import type { Pageable } from '#lib/api/picsure/pageable.types.ts';
import type { Sort } from '#lib/api/picsure/sort.types.ts';
import type { Facet } from '#lib/explorer/types.ts';

export interface DictionaryConceptResult {
  content: SearchResult[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: Pageable;
  size: number;
  sort: Sort;
  totalElements: number;
  totalPages: number;
}

export interface DictionaryFacetResult {
  name: string;
  display: string;
  description: string;
  facets: Facet[];
}

export interface DictionarySearchRequest {
  facets: Facet[];
  search: string;
  consents?: string[];
}

export type DashboardRow = Record<string, string | number | boolean | null>;

export interface DashboardResponse {
  columns: { label: string; dataElement: string }[];
  rows: DashboardRow[];
}

/** A dataset's dashboard-drawer fields, keyed by camel-case field name. */
export type DatasetDetails = Record<string, unknown>;

export interface GeneSearchPage {
  results: string[];
  total: number;
  page: number;
}

import type { Indexable } from '#lib/utils/objects.ts';
import type { Pageable } from '#lib/api/picsure/pageable.types.ts';
import type { Sort } from '#lib/api/picsure/sort.types.ts';

export type Facet = Indexable & {
  name: string;
  display: string;
  description: string | null;
  count: number;
  children?: Facet[];
  category: string;
  categoryRef?: ShallowFacetCategory;
  parentRef?: ShallowFacetCategory;
};

export type ShallowFacetCategory = Pick<Facet, 'name' | 'display' | 'description'>;

export type SearchResult = Indexable & {
  conceptPath: string;
  dataset: string;
  name: string;
  display: string;
  studyAcronym: string;
  description: string | null;
  values?: string[];
  min?: number;
  max?: number;
  meta?: Record<string, unknown> | null;
  table?: SearchResult | null;
  study?: SearchResult | null;
  fullName?: string;
  ref?: string;
  abbreviation?: string;
  type: 'Categorical' | 'Continuous' | 'AnyRecordOf';
  allowFiltering: boolean;
  children?: SearchResult[] | null;
};

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

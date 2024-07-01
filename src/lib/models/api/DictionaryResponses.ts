import { type SearchResult } from '$lib/models/Search';
import type { Pageable } from './Pageable';
import type { Sort } from './Sort';
import type { Facet } from '$lib/models/Search';

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

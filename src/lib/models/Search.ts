import type { Indexable } from '$lib/types';

export type Facet = Indexable & {
  name: string;
  display: string;
  description: string;
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
  description: string;
  values?: string[];
  min?: number;
  max?: number;
  meta?: Record<string, string> | null;
  table?: SearchResult | null;
  study?: SearchResult | null;
  type: 'Categorical' | 'Continuous' | 'AnyRecordOf';
  allowFiltering: boolean;
  children?: SearchResult[] | null;
};

import type { Indexable } from '$lib/types';

export type Facet = Indexable & {
  name: string;
  display: string;
  description: string;
  count: number;
  children?: Facet[];
  category: string;
  categoryRef?: ShallowFacetCategory;
};

export type ShallowFacetCategory = Pick<Facet, 'name' | 'display' | 'description'>;

export type SearchResult = Indexable & {
  conceptPath: string;
  dataset: string;
  name: string;
  display: string;
  description: string;
  values?: string[];
  min?: number;
  max?: number;
  meta?: Record<string, string> | null;
  type: 'Categorical' | 'Continuous';
};

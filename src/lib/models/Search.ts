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

export type ShallowFacetCategory = Indexable & {
  name: string;
  display: string;
  description: string;
};

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

// export function mapTags(typeData: { title: string; tags: string[] }): Facet {
//   return {
//     title: typeData.title,
//     tags: typeData.tags.map((tag) => ({
//       name: tag,
//       type: typeData.title,
//       state: TagCheckbox.Default,
//     })),
//   };
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export function mapSearchResults(data: any): SearchResult {
//   const segments = data.name.split('\\').filter((x: string) => x);
//   return {
//     id: data.name,
//     name: segments[segments.length - 1],
//     description: `categorical: ${data.categorical}, patients: ${data.patientCount}`,
//     isCategorical: data.categorical,
//     categoryValues: data.categoryValues || undefined,
//     min: data.min >= 0 ? data.min : undefined || undefined, //Fix TypeScript interpreting 0 as false
//     max: data.max >= 0 ? data.max : undefined || undefined, //Fix TypeScript interpreting 0 as false
//   };
// }

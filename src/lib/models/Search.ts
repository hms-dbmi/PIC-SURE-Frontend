import type { Indexable } from '$lib/types';

export enum TagCheckbox {
  Include = 'include',
  Exclude = 'exclude',
  Default = 'default',
}

export type SearchTag = Indexable & {
  name: string;
  type: string;
  state: TagCheckbox;
};

export type SearchTagType = Indexable & {
  title: string;
  tags: SearchTag[];
};

export type SearchResult = Indexable & {
  id: string;
  name: string;
  description: string;
  isCategorical: boolean;
  categoryValues?: string[];
  min?: number;
  max?: number;
};

export function mapTags(typeData: { title: string; tags: string[] }): SearchTagType {
  return {
    title: typeData.title,
    tags: typeData.tags.map((tag) => ({
      name: tag,
      type: typeData.title,
      state: TagCheckbox.Default,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSearchResults(data: any): SearchResult {
  const segments = data.name.split('\\').filter((x: string) => x);
  return {
    id: data.name,
    name: segments[segments.length - 1],
    description: `categorical: ${data.categorical}, patients: ${data.patientCount}`,
    isCategorical: data.categorical,
    categoryValues: data.categoryValues || undefined,
    min: data.min >= 0 ? data.min : undefined || undefined, //Fix TypeScript interpreting 0 as false
    max: data.max >= 0 ? data.max : undefined || undefined, //Fix TypeScript interpreting 0 as false
  };
}

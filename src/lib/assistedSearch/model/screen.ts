import type { ChatResponse, ScreenPart, ScreenState, SlimFacet } from './types.ts';

const PARTS: ScreenPart[] = ['query', 'facets', 'search'];

// Comparison ignores what the two sides disagree on without meaning to: the UI keeps a `type`
// discriminator and explicit `not: false`, the service sends neither, and either may carry nulls
// or leave an empty list out. `values` are sets of strings, so their order means nothing.
// The query contract has no field named `type`; only the UI's two clause tags are dropped.
const CLAUSE_TAGS = ['PhenotypicFilter', 'PhenotypicSubquery'];

function canonical(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) {
    const items = value.map((v) => canonical(v));
    return key === 'values' ? items.sort() : items;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, v]) =>
            !(key === 'type' && CLAUSE_TAGS.includes(v as string)) &&
            v !== null &&
            v !== undefined &&
            !(key === 'not' && v === false) &&
            !(Array.isArray(v) && v.length === 0),
        )
        .map(([key, v]) => [key, canonical(v, key)])
        .sort(([a], [b]) => (a as string).localeCompare(b as string)),
    );
  }
  return value;
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

const facetKey = (f: SlimFacet) => `${f.category}\u0000${f.name}`;

export const sameFacets = (a: SlimFacet[], b: SlimFacet[]) =>
  same([...a.map(facetKey)].sort(), [...b.map(facetKey)].sort());

export const sameSearch = (a: string, b: string) => a.trim() === b.trim();

export const sameScreen = (a: ScreenState, b: ScreenState) =>
  same(a.query, b.query) && sameFacets(a.facets, b.facets) && sameSearch(a.search, b.search);

/**
 * The parts of a response that differ from what is on screen, so a reply that restates the current
 * state is not applied (and gets no undo). A present part replaces that part whole.
 */
export function changedParts(response: ChatResponse, current: ScreenState): Partial<ScreenState> {
  const changes: Partial<ScreenState> = {};
  if (response.query && !same(response.query, current.query)) changes.query = response.query;
  if (response.facets && !sameFacets(response.facets, current.facets)) {
    changes.facets = response.facets;
  }
  if (response.search !== undefined && !sameSearch(response.search, current.search)) {
    changes.search = response.search;
  }
  return changes;
}

export const partsOf = (changes: Partial<ScreenState>): ScreenPart[] =>
  PARTS.filter((part) => changes[part] !== undefined);

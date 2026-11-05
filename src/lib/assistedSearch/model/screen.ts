import type { ChatResponse, ScreenPart, ScreenState, SlimFacet } from './types';

const PARTS: ScreenPart[] = ['query', 'facets', 'search'];

// Comparison ignores what the two sides disagree on without meaning to: the UI keeps a `type`
// discriminator and explicit `not: false`, the service sends neither, and either may carry nulls.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, v]) => key !== 'type' && v !== null && v !== undefined && v !== false)
        .map(([key, v]) => [key, canonical(v)])
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

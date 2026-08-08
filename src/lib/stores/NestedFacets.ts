import { writable, type Writable } from 'svelte/store';

// Nested-facet expansion state, keyed by nestedFacetKey because facet names repeat
// across categories (e.g. facet1 exists in two categories in the e2e fixtures).
// Category-level accordion state is the separate openFacets store in Dictionary.ts.
// Deliberately not reset when facets reload, so expansion survives the re-render a
// selection causes — and deliberately survives searching away and coming back.
// Cleared by resetSearch and by tour exit.
export const expandedNestedFacets: Writable<string[]> = writable([]);

// JSON encoding is injective; a plain `:` join would collide when names contain `:`.
export function nestedFacetKey(category: string, facetName: string): string {
  return JSON.stringify([category, facetName]);
}

export function toggleNestedFacet(key: string) {
  expandedNestedFacets.update((keys) =>
    keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
  );
}

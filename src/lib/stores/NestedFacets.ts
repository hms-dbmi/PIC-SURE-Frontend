import { writable, type Writable } from 'svelte/store';

// Nested-facet expansion state, keyed `<category name>:<facet name>` because facet
// names repeat across categories (e.g. facet1 exists in two categories in the e2e
// fixtures). Category-level accordion state is the separate openFacets store in
// Dictionary.ts. Deliberately not reset when facets reload, so expansion survives the
// re-render a selection causes — and deliberately survives searching away and coming
// back. Cleared by resetSearch and by tour exit.
export const expandedNestedFacets: Writable<string[]> = writable([]);

export function toggleNestedFacet(key: string) {
  expandedNestedFacets.update((keys) =>
    keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
  );
}

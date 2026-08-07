import { writable, type Writable } from 'svelte/store';

// Parent facets whose child lists are expanded, keyed by facet name — facet names are
// treated as globally unique, matching how selection works in Search.ts. Deliberately
// not reset when facets reload, so expansion survives the re-render a selection causes;
// only resetSearch clears it.
export const expandedNestedFacets: Writable<string[]> = writable([]);

export function toggleNestedFacet(name: string) {
  expandedNestedFacets.update((names) =>
    names.includes(name) ? names.filter((n) => n !== name) : [...names, name],
  );
}

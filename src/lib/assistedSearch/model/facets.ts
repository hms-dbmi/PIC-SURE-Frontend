import type { DictionaryFacetResult, Facet } from '#lib/api/picsure/dictionary.types.ts';
import type { SlimFacet } from './types.ts';

export const toSlimFacets = (facets: Facet[]): SlimFacet[] =>
  facets.map(({ category, name }) => ({ category, name }));

/**
 * Turns the service's `{ category, name }` selection back into the UI's `Facet`s, using the facet
 * list on screen for display text and counts. One the list does not hold (it is narrowed by the
 * current search) becomes a bare facet, which the dictionary accepts since it only reads category
 * and name.
 */
export function resolveFacets(wanted: SlimFacet[], categories: DictionaryFacetResult[]): Facet[] {
  const known = new Map<string, Facet>();
  for (const category of categories) {
    for (const facet of category.facets) {
      known.set(`${category.name}\u0000${facet.name}`, { ...facet, category: category.name });
      for (const child of facet.children ?? []) {
        known.set(`${category.name}\u0000${child.name}`, { ...child, category: category.name });
      }
    }
  }
  return wanted.map(
    ({ category, name }) =>
      known.get(`${category}\u0000${name}`) ?? {
        category,
        name,
        display: name,
        description: null,
        count: 0,
      },
  );
}

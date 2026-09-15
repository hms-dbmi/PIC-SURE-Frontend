import {
  createCategoricalFilter,
  createNumericFilter,
  createRequiredFilter,
  type Filter,
} from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

/**
 * The decisions the variable detail page's filter panel makes, kept out of the component so
 * they can be tested without a DOM.
 *
 * Two of them are easy to get subtly wrong and neither is visible from the panel's markup:
 * an applied "any value" filter carries *no* values but means *every* value, and a selection
 * covering every value has to be written back as "any value" rather than as a list.
 */

/**
 * The values a panel should open with, given the filter the variable already has.
 *
 * `createRequiredFilter` records "filter to any value" as a `Categorical` filter with an
 * empty `categoryValues`, so an empty list is every value and not none. Values the filter
 * carries which the dictionary no longer lists are kept: dropping them would silently
 * loosen the user's filter the next time they pressed the button.
 */
export function selectionFromFilter(values: string[], filter?: Filter): string[] {
  if (filter?.filterType !== 'Categorical') return [];
  if (filter.categoryValues.length === 0) return [...values];
  return [...filter.categoryValues];
}

/** Whether a selection covers every value the variable has, and so constrains nothing. */
export function coversEveryValue(values: string[], selected: string[]): boolean {
  if (values.length === 0) return false;
  const chosen = new Set(selected);
  return values.every((value) => chosen.has(value));
}

/**
 * The filter a categorical selection should produce, or `undefined` for a selection that
 * cannot be expressed as one.
 *
 * Selecting every value is "filter to any value" - a `required` filter, which reads that way
 * on the chip - rather than a list that happens to name them all. An empty selection is not a
 * filter at all: `createCategoricalFilter(concept, [])` would restrict nothing while claiming
 * to, which is why the button that calls this is disabled until something is picked.
 */
export function filterForSelection(concept: SearchResult, selected: string[]): Filter | undefined {
  if (selected.length === 0) return undefined;
  const values = concept.values ?? [];
  return coversEveryValue(values, selected)
    ? createRequiredFilter(concept)
    : createCategoricalFilter(concept, selected);
}

/**
 * The filter a min/max pair should produce.
 *
 * Both bounds blank is deliberate and stays addable: it means every participant with a
 * measurement, and `createNumericFilter` records it as "any value".
 */
export function filterForRange(concept: SearchResult, min: string, max: string): Filter {
  return createNumericFilter(concept, min || undefined, max || undefined);
}

/**
 * The related variables the panel stacks under the main value list.
 *
 * The dictionary has no field for these: `children` on a concept detail response is the only
 * thing that names concepts belonging to this one, so a categorical child carrying values is
 * read as a related variable. A leaf variable has none and the panel renders the simple
 * two-column layout.
 */
export function relatedVariablesOf(concept: SearchResult): SearchResult[] {
  return (concept.children ?? []).filter(
    (child) => child.type === 'Categorical' && (child.values?.length ?? 0) > 0,
  );
}

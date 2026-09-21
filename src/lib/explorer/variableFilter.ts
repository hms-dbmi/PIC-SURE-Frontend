import {
  createCategoricalFilter,
  createNumericFilter,
  createRequiredFilter,
  type Filter,
} from '$lib/models/Filter.svelte';
import type { SearchResult } from '$lib/models/Search';

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

/**
 * Set equality, not coverage: a selection may carry values the dictionary no longer
 * offers, because `selectionFromFilter` keeps them. Testing only "every current value
 * is selected" would silently widen such a filter to any-value.
 */
export function selectionIsEveryValue(values: string[], selected: string[]): boolean {
  if (values.length === 0) return false;
  const offered = new Set(values);
  const chosen = new Set(selected);
  return chosen.size === offered.size && values.every((value) => chosen.has(value));
}

export function filterForSelection(concept: SearchResult, selected: string[]): Filter | undefined {
  if (selected.length === 0) return undefined;
  const values = concept.values ?? [];
  return selectionIsEveryValue(values, selected)
    ? createRequiredFilter(concept)
    : createCategoricalFilter(concept, selected);
}

export function filterForRange(concept: SearchResult, min: string, max: string): Filter {
  return createNumericFilter(concept, min || undefined, max || undefined);
}

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

/**
 * Whether a selection is exactly the variable's values, and so constrains nothing.
 *
 * The two have to match as sets, not merely cover: a selection may carry values the
 * dictionary has since stopped offering, because `selectionFromFilter` keeps them rather than
 * loosening the user's filter behind their back. Asking only whether every *current* value is
 * selected read a stored restriction of `[A, B]`, against a dictionary now offering only
 * `[A]`, as covering everything - and the next press of Filter Participants rewrote it as an
 * any-value filter, admitting the values it had excluded. A re-index is all that takes.
 */
export function coversEveryValue(values: string[], selected: string[]): boolean {
  if (values.length === 0) return false;
  const offered = new Set(values);
  const chosen = new Set(selected);
  return chosen.size === offered.size && values.every((value) => chosen.has(value));
}

/**
 * Whether this concept may not be filtered on: the rule the results row's filter icon uses,
 * in one place because three callers need it.
 *
 * An open-access visitor may not filter on a variable the dictionary marks unfilterable. An
 * authenticated user may, which is why this is not `!allowFiltering` on its own.
 */
export function filteringRefused(concept: SearchResult, openAccess: boolean): boolean {
  return openAccess && !concept.allowFiltering;
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

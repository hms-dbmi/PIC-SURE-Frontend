import type { SearchResult } from '#lib/explorer/types.ts';
import {
  type Filter,
  createCategoricalFilter,
  createNumericFilter,
  createRequiredFilter,
} from '#lib/query/filter.svelte.ts';

export interface FilterFormValues {
  values: string[];
  min: string;
  max: string;
}

/**
 * The filter a filled-in form describes, or undefined while a categorical one has no values.
 * Selecting every value makes it a "has any value" filter; empty bounds leave a numeric
 * filter open on that side.
 */
export function buildFilter(concept: SearchResult, form: FilterFormValues): Filter | undefined {
  if (concept.type === 'Categorical') {
    if (form.values.length === 0) return undefined;
    return form.values.length === concept.values?.length
      ? createRequiredFilter(concept)
      : createCategoricalFilter(concept, form.values);
  }
  return createNumericFilter(concept, form.min || undefined, form.max || undefined);
}

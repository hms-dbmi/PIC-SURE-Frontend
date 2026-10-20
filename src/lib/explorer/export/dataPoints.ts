import type { Filter } from '#lib/query/filter.svelte.ts';

export const DEFAULT_MAX_DATA_POINTS = 1000000;

/**
 * The variables a user chose to export: one per phenotypic filter (one per concept for an
 * any-record-of filter) and one per added variable. Genomic filters add no column, and the patient
 * ID and system fields every export has are left out.
 */
export function exportVariableCount(
  phenotypicFilters: readonly Filter[],
  addedVariables: number,
): number {
  return phenotypicFilters.reduce(
    (count, filter) => count + (filter.filterType === 'AnyRecordOf' ? filter.concepts.length : 1),
    addedVariables,
  );
}

/**
 * Participants times variables, the cells of the export's table. HPDS's own limit has the same
 * shape (rows times row width); MAX_DATA_POINTS_FOR_EXPORT is checked only here.
 */
export function dataPoints(participants: unknown, variables: number): number | undefined {
  return typeof participants === 'number' ? participants * variables : undefined;
}

/** An unknown size counts as over the limit, so an export can't start before it's known. */
export function exceedsLimit(points: number | undefined, max: number): boolean {
  return points === undefined || points > max;
}

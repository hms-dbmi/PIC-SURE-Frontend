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
 * shape (rows times row width), but MAX_DATA_POINTS_FOR_EXPORT is checked only in the UI.
 */
export function dataPoints(participants: unknown, variables: number): number | undefined {
  return typeof participants === 'number' ? participants * variables : undefined;
}

/**
 * Whether an export of this size may go ahead: `pending` while the participant count loads,
 * `unknown` when it failed or isn't a number, then `over` or `ok` against the limit. Only `ok`
 * lets the export through.
 */
export type SizeCheck = 'pending' | 'unknown' | 'over' | 'ok';

export function checkSize(
  count: { pending: boolean; failed: boolean },
  points: number | undefined,
  max: number,
): SizeCheck {
  if (count.pending) return 'pending';
  if (count.failed || points === undefined) return 'unknown';
  return points > max ? 'over' : 'ok';
}

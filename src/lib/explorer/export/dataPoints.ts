import type { Filter } from '#lib/query/filter.svelte.ts';

export const DEFAULT_MAX_DATA_POINTS = 1000000;

/**
 * Columns an export adds per participant: one per filter, one per concept of an any-record-of
 * filter instead of one for the filter, and one per added variable.
 */
export function exportVariableCount(filters: readonly Filter[], addedVariables: number): number {
  return filters.reduce(
    (count, filter) => count + (filter.filterType === 'AnyRecordOf' ? filter.concepts.length : 1),
    addedVariables,
  );
}

/**
 * Participants times variables: the cells of the export's table. HPDS sizes an export the same
 * way (row width times rows) and refuses one that won't fit. Undefined while the participant
 * count isn't a number (still loading, failed, or obfuscated).
 */
export function dataPoints(participants: unknown, variables: number): number | undefined {
  return typeof participants === 'number' ? participants * variables : undefined;
}

/** An unknown size counts as over the limit, so an export can't start before it's known. */
export function exceedsLimit(points: number | undefined, max: number): boolean {
  return points === undefined || points > max;
}

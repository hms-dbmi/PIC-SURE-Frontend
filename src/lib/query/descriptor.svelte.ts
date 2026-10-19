import type { QueryFilters } from '#lib/query/build.ts';

/**
 * Plain-data descriptor of a count query. `phenotypicClause` and
 * `genomicFilters` must be free of Svelte `$state` proxies, so the descriptor
 * hashes stably and cached requests can share it. Use `buildDescriptor` rather
 * than hand-constructing.
 */
export interface QueryDescriptor extends QueryFilters {
  isOpenAccess: boolean;
}

export function buildDescriptor(isOpenAccess: boolean, filters: QueryFilters): QueryDescriptor {
  return { isOpenAccess, ...($state.snapshot(filters) as QueryFilters) };
}

// Object keys sorted at every depth so `{a:1,b:2}` and `{b:2,a:1}` hash the
// same. Arrays preserve order (filter order is semantically meaningful).
// Undefined values are dropped from objects (matches JSON.stringify) — without
// this, `{min: undefined, max: 10}` would hash differently from `{max: 10}`.
function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return (
    '{' + entries.map(([k, v]) => JSON.stringify(k) + ':' + stableStringify(v)).join(',') + '}'
  );
}

export function stableHash(descriptor: QueryDescriptor): string {
  return stableStringify(descriptor);
}

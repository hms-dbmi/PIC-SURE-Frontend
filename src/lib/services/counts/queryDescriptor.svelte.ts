import type { LogicTree } from '$lib/models/LogicTree.svelte';
import type { Filter, FilterInterface } from '$lib/models/Filter.svelte';
import type { PhenotypicClause, GenomicFilterInterfacev3 } from '$lib/models/query/Query';
import {
  buildPhenotypicClauseFromTree,
  buildGenomicFiltersFromFilters,
} from '$lib/utilities/QueryBuilder';

/**
 * Plain-data descriptor of a count query. `phenotypicClause` and
 * `genomicFilters` must be free of Svelte `$state` proxies — downstream code
 * structuredClones them. Use `buildDescriptor` rather than hand-constructing.
 */
export interface QueryDescriptor {
  isOpenAccess: boolean;
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicFilterInterfacev3[];
}

export interface DescriptorInputs {
  isOpenAccess: boolean;
  filterTree: LogicTree<FilterInterface>;
  genomicFilters: Filter[];
}

export function buildDescriptor(inputs: DescriptorInputs): QueryDescriptor {
  const rawClause = buildPhenotypicClauseFromTree(inputs.filterTree);
  const rawGenomic = buildGenomicFiltersFromFilters(inputs.genomicFilters);
  return {
    isOpenAccess: inputs.isOpenAccess,
    phenotypicClause: rawClause ? ($state.snapshot(rawClause) as PhenotypicClause) : null,
    genomicFilters: $state.snapshot(rawGenomic) as GenomicFilterInterfacev3[],
  };
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
    '{' +
    entries.map(([k, v]) => JSON.stringify(k) + ':' + stableStringify(v)).join(',') +
    '}'
  );
}

export function stableHash(descriptor: QueryDescriptor): string {
  return stableStringify(descriptor);
}

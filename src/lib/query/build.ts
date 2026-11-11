import {
  createQuery,
  toQueryJson,
  type ExpectedResultType,
  type GenomicClause,
  type PhenotypicClause,
  type PhenotypicFilter,
  type Query,
} from '#lib/query/query.ts';
import type { QueryRequest } from '#lib/api/picsure/query.types.ts';
import type {
  Filter,
  FilterInterface,
  GenomicFilterInterface,
  SnpFilterInterface,
} from '#lib/query/filter.svelte.ts';
import { GENE_FILTER_KEYS, GENOMIC_RANGE_KEY } from '#lib/query/genomic.ts';
import type { LogicTree } from '#lib/query/logicTree.svelte.ts';

export interface QueryFilters {
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicClause[];
}

const parseNumber = (input: string | number | null | undefined): number | undefined => {
  if (input === null || input === undefined) return undefined;
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;

  const trimmed = input.trim();
  if (trimmed === '') return undefined;

  // remove grouping separators: comma, space, NBSP, thin space, underscore
  const normalized = trimmed.replace(/[,_\s\u00A0\u202F]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

export function treeToClause(tree: LogicTree<FilterInterface>): PhenotypicClause | null {
  if (tree.root.children.length === 0) return null;

  const mapNode = (node: FilterInterface): PhenotypicClause => {
    if (tree.isGroup(node)) {
      return {
        type: 'PhenotypicSubquery',
        operator: node.operator,
        phenotypicClauses: node.children.map(mapNode),
        not: false,
      };
    }
    return filterToClause(node as Filter);
  };
  return mapNode(tree.root);
}

export function genomicToClauses(genomicFilters: Filter[]): GenomicClause[] {
  return genomicFilters.flatMap((filter) => {
    if (filter.filterType === 'snp') return snpFilterToClauses(filter);
    if (filter.filterType === 'genomic') return geneFilterToClauses(filter);
    return [];
  });
}

export function toQueryFilters(
  tree: LogicTree<FilterInterface>,
  genomicFilters: Filter[],
): QueryFilters {
  return {
    phenotypicClause: treeToClause(tree),
    genomicFilters: genomicToClauses(genomicFilters),
  };
}

/**
 * The one request factory. `filters` null sends no filters. `edit` sees the query before it is
 * serialised; it may set its own fields but must not mutate the clauses in `filters`, which
 * are shared (use `appendClauses`).
 */
export function buildRequest(
  filters: QueryFilters | null,
  expectedResultType: ExpectedResultType = 'COUNT',
  edit: (query: Query) => Query = (query) => query,
): QueryRequest {
  const query = createQuery({ expectedResultType });
  if (filters) {
    query.phenotypicClause = filters.phenotypicClause;
    query.genomicFilters = [...filters.genomicFilters];
  }
  return { query: toQueryJson(edit(query)) };
}

/** Every concept path a query filters on, with any-record-of filters expanded from `filters`. */
export function filterConcepts(query: Query, filters: readonly Filter[]): string[] {
  const concepts: string[] = [];

  function mapClause(clause: PhenotypicClause): void {
    if (clause.type === 'PhenotypicSubquery') {
      clause.phenotypicClauses.forEach(mapClause);
    } else if (clause.phenotypicFilterType === 'ANY_RECORD_OF') {
      const anyRecordFilter = filters.find((filter) => filter.id === clause.conceptPath);
      if (anyRecordFilter?.filterType === 'AnyRecordOf') concepts.push(...anyRecordFilter.concepts);
    } else {
      concepts.push(clause.conceptPath);
    }
  }
  if (query.phenotypicClause) mapClause(query.phenotypicClause);

  return concepts;
}

function filterToClause(filter: Filter): PhenotypicFilter {
  const clause: PhenotypicFilter = {
    type: 'PhenotypicFilter',
    phenotypicFilterType: 'FILTER',
    conceptPath: filter.id,
    not: false,
  };
  switch (filter.filterType) {
    case 'AnyRecordOf':
      clause.phenotypicFilterType = 'ANY_RECORD_OF';
      break;

    case 'required':
      clause.phenotypicFilterType = 'REQUIRED';
      break;

    case 'numeric':
      if (filter.min === undefined && filter.max === undefined) {
        clause.phenotypicFilterType = 'REQUIRED';
      }
      if (filter.min !== undefined) {
        clause.min = parseNumber(filter.min);
      }
      if (filter.max !== undefined) {
        clause.max = parseNumber(filter.max);
      }
      break;

    case 'Categorical':
      if (!filter.categoryValues?.length) {
        clause.phenotypicFilterType = 'REQUIRED';
      } else {
        clause.values = filter.categoryValues;
      }
      break;
  }
  return clause;
}

// A range is sent only when no variant-info value is set.
function geneFilterToClauses(filter: GenomicFilterInterface): GenomicClause[] {
  const valueClauses: GenomicClause[] = GENE_FILTER_KEYS.flatMap((key) => {
    const values = filter[key];
    return values && values.length > 0 ? [{ key, values }] : [];
  });
  if (valueClauses.length > 0) return valueClauses;

  const min = filter.min ? parseNumber(filter.min) : undefined;
  const max = filter.max ? parseNumber(filter.max) : undefined;
  if (min === undefined && max === undefined) return [];
  return [
    {
      key: GENOMIC_RANGE_KEY,
      ...(min !== undefined && { min }),
      ...(max !== undefined && { max }),
    },
  ];
}

function snpFilterToClauses(snps: SnpFilterInterface): GenomicClause[] {
  return (snps.snpValues || []).map((snp) => ({
    key: snp.search,
    values: snp.constraint.split(','),
  }));
}

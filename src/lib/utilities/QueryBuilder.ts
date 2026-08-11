import {
  QueryV3,
  type ExpectedResultType,
  type PhenotypicFilterInterface,
  type PhenotypicSubqueryInterface,
  type PhenotypicFilterType,
  type PhenotypicClause,
} from '$lib/models/query/Query';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { filters, filterTree, genomicFilters } from '$lib/stores/Filter';
import type {
  Filter,
  FilterType,
  FilterInterface,
  GenomicFilterInterface,
  SnpFilterInterface,
  AnyRecordOfFilterInterface,
} from '$lib/models/Filter.svelte';
import { LogicTree } from '$lib/models/LogicTree.svelte';
import type { GenomicFilterInterfacev3, OperatorType } from '$lib/models/query/Query';

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

// -------------------------------- V3 Query -------------------------------- //

function serializeQueryV3(query: QueryV3) {
  return JSON.parse(
    JSON.stringify(query, (key, value) => {
      if (key === 'type') return undefined;
      return value;
    }),
  );
}

export function buildPhenotypicClauseFromTree(
  tree: LogicTree<FilterInterface>,
): PhenotypicClause | null {
  if (tree.root.children.length === 0) return null;

  const groupClause = (operator: OperatorType): PhenotypicSubqueryInterface => ({
    type: 'PhenotypicSubquery',
    operator,
    phenotypicClauses: [],
    not: false,
  });
  const mapNode = (node: FilterInterface): PhenotypicClause => {
    if (tree.isGroup(node)) {
      const newGroup = groupClause(node.operator);
      newGroup.phenotypicClauses = node.children.map(mapNode);
      return newGroup;
    }
    return convertPhenotypicFilterToClause(node as Filter);
  };
  return mapNode(tree.root);
}

export function buildGenomicFiltersFromFilters(
  genomicFilters: Filter[],
): GenomicFilterInterfacev3[] {
  const out: GenomicFilterInterfacev3[] = [];
  genomicFilters.forEach((filter: Filter) => {
    if (filter.filterType === 'snp') {
      convertSnpFilterToClause(filter).forEach((g) => out.push(g));
    } else if (filter.filterType === 'genomic') {
      convertGenomicFilterToClause(filter).forEach((g) => out.push(g));
    }
  });
  return out;
}

export function buildQueryRequestV3FromDescriptor(
  descriptor: import('$lib/services/counts/queryDescriptor.svelte').QueryDescriptor,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryRequestInterfaceV3 {
  let query: QueryV3 = new QueryV3();
  query.expectedResultType = expectedResultType;
  // Defensive clone: QueryV3.addClause reassigns `phenotypicClauses` on the
  // existing clause object, so an aliased descriptor.phenotypicClause would be
  // mutated by mutateMethod. The descriptor must remain immutable so stableHash
  // stays stable for cache lookups.
  query.phenotypicClause = descriptor.phenotypicClause
    ? structuredClone(descriptor.phenotypicClause)
    : null;
  descriptor.genomicFilters.forEach((g) => query.genomicFilters.push(structuredClone(g)));
  query = mutateMethod(query);
  return { query: serializeQueryV3(query) };
}

export function getFilterConcepts(query: QueryV3): string[] {
  if (query.phenotypicClause == null) return [];

  const concepts: string[] = [];

  function mapClause(clause: PhenotypicClause): void {
    if (clause.type === 'PhenotypicSubquery' && clause.phenotypicClauses.length > 0) {
      clause.phenotypicClauses.forEach(mapClause);
      return;
    }
    const thisFilter = clause as PhenotypicFilterInterface;
    if (thisFilter.phenotypicFilterType === 'ANY_RECORD_OF') {
      const anyRecordFilter = get(filters).find(
        (filter) => filter.id === thisFilter.conceptPath,
      ) as AnyRecordOfFilterInterface | undefined;
      if (!anyRecordFilter) return;
      anyRecordFilter.concepts.forEach((concept) => concepts.push(concept));
    } else {
      concepts.push(thisFilter.conceptPath);
    }
  }
  mapClause(query.phenotypicClause);

  return concepts;
}

export function getQueryRequestV3(
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryRequestInterfaceV3 {
  return getBlankQueryRequestV3(expectedResultType, (query: QueryV3) => {
    query.phenotypicClause = buildPhenotypicClauseFromTree(get(filterTree));
    get(genomicFilters).forEach((filter: Filter) => {
      if (filter.filterType === 'snp') {
        convertSnpFilterToClause(filter).forEach((genomicFilter) => {
          query.genomicFilters.push(genomicFilter);
        });
      } else if (filter.filterType === 'genomic') {
        convertGenomicFilterToClause(filter).forEach((genomicFilter) => {
          query.genomicFilters.push(genomicFilter);
        });
      }
    });
    return mutateMethod(query);
  });
}

export function getBlankQueryRequestV3(
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryRequestInterfaceV3 {
  let query: QueryV3 = new QueryV3();
  query.expectedResultType = expectedResultType;

  query = mutateMethod(query);

  return {
    query: serializeQueryV3(query),
  };
}

const convertPhenotypicFilterToClause = (filter: Filter): PhenotypicFilterInterface => {
  const newFilterClause: PhenotypicFilterInterface = {
    type: 'PhenotypicFilter',
    phenotypicFilterType: convertFilterTypeToClauseType(filter.filterType),
    conceptPath: filter.id,
    not: false,
  };
  switch (filter.filterType) {
    case 'AnyRecordOf':
      newFilterClause.phenotypicFilterType = 'ANY_RECORD_OF';
      break;

    case 'required':
      newFilterClause.phenotypicFilterType = 'REQUIRED';
      break;

    case 'numeric':
      if (filter.min === undefined && filter.max === undefined) {
        newFilterClause.phenotypicFilterType = 'REQUIRED';
      }
      if (filter.min !== undefined) {
        newFilterClause.min = parseNumber(filter.min);
      }
      if (filter.max !== undefined) {
        newFilterClause.max = parseNumber(filter.max);
      }
      break;

    case 'Categorical':
      if (!filter.categoryValues?.length) {
        newFilterClause.phenotypicFilterType = 'REQUIRED';
      } else {
        newFilterClause.values = filter.categoryValues;
      }
      break;
  }
  return newFilterClause;
};

const convertGenomicFilterToClause = (
  filter: GenomicFilterInterface,
): GenomicFilterInterfacev3[] => {
  const genomicFilters: GenomicFilterInterfacev3[] = [];

  const hasMinMax =
    (filter.min !== undefined && filter.min !== '') ||
    (filter.max !== undefined && filter.max !== '');
  const hasCategoricalValues =
    (filter.Gene_with_variant && filter.Gene_with_variant.length > 0) ||
    (filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0) ||
    (filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0);

  if (hasMinMax && !hasCategoricalValues) {
    const min = filter.min ? parseNumber(filter.min) : undefined;
    const max = filter.max ? parseNumber(filter.max) : undefined;
    return convertNumericGenomicFilterToClause('genomic_range', min, max);
  }
  if (filter.Gene_with_variant && filter.Gene_with_variant.length > 0) {
    genomicFilters.push({
      key: 'Gene_with_variant',
      values: filter.Gene_with_variant,
    });
  }

  if (filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0) {
    genomicFilters.push({
      key: 'Variant_consequence_calculated',
      values: filter.Variant_consequence_calculated,
    });
  }

  if (filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0) {
    genomicFilters.push({
      key: 'Variant_frequency_as_text',
      values: filter.Variant_frequency_as_text,
    });
  }

  return genomicFilters;
};

const convertSnpFilterToClause = (snps: SnpFilterInterface): GenomicFilterInterfacev3[] => {
  const genomicFilters: GenomicFilterInterfacev3[] = [];

  (snps.snpValues || []).forEach((snp) => {
    genomicFilters.push({
      key: snp.search,
      values: snp.constraint.split(','),
    });
  });

  return genomicFilters;
};

const convertNumericGenomicFilterToClause = (
  key: string,
  min?: number,
  max?: number,
): GenomicFilterInterfacev3[] => {
  if (min !== undefined && max !== undefined) {
    return [{ key, min, max }];
  } else if (min !== undefined) {
    return [{ key, min }];
  } else if (max !== undefined) {
    return [{ key, max }];
  }
  return [];
};

function convertFilterTypeToClauseType(filterType: FilterType): PhenotypicFilterType {
  switch (filterType) {
    case 'Categorical':
    case 'numeric':
      return 'FILTER';
    case 'AnyRecordOf':
      return 'ANY_RECORD_OF';
    case 'required':
      return 'REQUIRED';
    case 'snp':
      return 'FILTER';
  }
  return 'FILTER';
}

import {
  QueryV2,
  QueryV3,
  type ExpectedResultType,
  type QueryInterfaceV2,
  type PhenotypicFilterInterface,
  type PhenotypicSubqueryInterface,
  type PhenotypicFilterType,
  type PhenotypicClause,
} from '$lib/models/query/Query';
import { features } from '$lib/configuration';
import type { QueryRequestInterfaceV2, QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { filters, filterTree, genomicFilters, hasGenomicFilter } from '$lib/stores/Filter';
import { exports } from '$lib/stores/Export';
import { resources } from '$lib/stores/Resources';
import type {
  Filter,
  FilterType,
  FilterInterface,
  GenomicFilterInterface,
  SnpFilterInterface,
  AnyRecordOfFilterInterface,
} from '$lib/models/Filter';
import { Tree, type TreeNode } from '$lib/models/Tree';
import type { GenomicFilterInterfacev3, OperatorType } from '$lib/models/query/Query';
import type { ExportInterface } from '$lib/models/Export.ts';

const harmonizedPath = '\\DCC Harmonized data set';
const harmonizedConsentPath = '\\_harmonized_consent\\';
const topmedConsentPath = '\\_topmed_consents\\';

// -------------------------------- V2 Query -------------------------------- //

export function getQueryRequestV2(
  addConsents = true,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV2) => QueryV2 = (q) => q,
): QueryRequestInterfaceV2 {
  return getBlankQueryRequestV2(
    !addConsents,
    resourceUUID,
    expectedResultType,
    (query: QueryV2) => {
      [...get(genomicFilters), ...get(filters)].forEach((filter: Filter) => {
        if (filter.filterType === 'Categorical') {
          if (filter.displayType === 'restrict') {
            query.addCategoryFilter(filter.id, filter.categoryValues);
          } else {
            query.addRequiredField(filter.id);
          }
        } else if (filter.filterType === 'numeric') {
          query.addNumericFilter(filter.id, filter.min || '', filter.max || '');
        } else if (filter.filterType === 'genomic') {
          query.addCategoryVariantInfoFilters({
            Gene_with_variant: filter.Gene_with_variant,
            Variant_consequence_calculated: filter.Variant_consequence_calculated,
            Variant_frequency_as_text: filter.Variant_frequency_as_text,
          });
        } else if (filter.filterType === 'snp') {
          query.addSnpFilter(filter.snpValues);
        } else if (filter.filterType === 'AnyRecordOf') {
          query.addAnyRecordOfMulti(filter.concepts);
        }
      });

      (get(exports) as ExportInterface[]).forEach((exportedField) => {
        if (exportedField.conceptPath) {
          query.addField(exportedField.conceptPath);
        }
      });
      return mutateMethod(query);
    },
  );
}

export function getBlankQueryRequestV2(
  isOpenAccess = false,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV2) => QueryV2 = (q) => q,
): QueryRequestInterfaceV2 {
  let query: QueryV2 = new QueryV2();

  if (features.useQueryTemplate && !isOpenAccess) {
    const queryTemplate: QueryInterfaceV2 = get(user).queryTemplate as QueryInterfaceV2;
    if (queryTemplate) {
      query = new QueryV2(structuredClone(queryTemplate));
    }
  }

  query = mutateMethod(query);

  if (features.requireConsents && !isOpenAccess) {
    query = updateConsentFilters(query);
  }

  query.expectedResultType = expectedResultType;

  return {
    query,
    resourceUUID,
  };
}

export const updateConsentFilters = (query: QueryV2) => {
  if (
    !hasHarmonizedPath(query.categoryFilters) &&
    !hasHarmonizedPath(query.numericFilters) &&
    !fieldsIncludeHarmonizedPath(query.fields) &&
    !fieldsIncludeHarmonizedPath(query.requiredFields)
  ) {
    query.removeCategoryFilter(harmonizedConsentPath);
  }

  if (!get(hasGenomicFilter)) {
    query.removeCategoryFilter(topmedConsentPath);
  }

  return query;
};

const hasHarmonizedPath = (obj: object): boolean => {
  return Object.keys(obj).some((concept) => concept.includes(harmonizedPath));
};

const fieldsIncludeHarmonizedPath = (arr: string[]): boolean => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};

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

function getClausesFromTree(tree: Tree<FilterInterface>): PhenotypicClause | null {
  if (tree.root.children.length === 0) return null;

  const groupClause = (operator: OperatorType): PhenotypicSubqueryInterface => ({
    type: 'PhenotypicSubquery',
    operator,
    phenotypicClauses: [],
    not: false,
  });
  const mapNode = (node: TreeNode<FilterInterface>): PhenotypicClause => {
    if (tree.isGroup(node)) {
      const newGroup = groupClause(node.operator);
      newGroup.phenotypicClauses = node.children.map(mapNode);
      return newGroup;
    }
    return convertPhenotypicFilterToClause(node as Filter);
  };
  return mapNode(tree.root);
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
  addConsents = true,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryRequestInterfaceV3 {
  return getBlankQueryRequestV3(
    !addConsents,
    resourceUUID,
    expectedResultType,
    (query: QueryV3) => {
      query.phenotypicClause = getClausesFromTree(get(filterTree));
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
    },
  );
}

export function getBlankQueryRequestV3(
  isOpenAccess = false,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
  mutateMethod: (query: QueryV3) => QueryV3 = (q) => q,
): QueryRequestInterfaceV3 {
  let query: QueryV3 = new QueryV3();
  query.expectedResultType = expectedResultType;

  query = mutateMethod(query);

  if (features.requireConsents && !isOpenAccess) {
    addAuthorizationFiltersV3(query);
  }

  return {
    query: serializeQueryV3(query),
    resourceUUID,
  };
}

function addAuthorizationFiltersV3(query: QueryV3): void {
  if (features.useQueryTemplate) {
    const queryTemplate: QueryInterfaceV2 = get(user).queryTemplate as QueryInterfaceV2;
    if (queryTemplate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const consents = queryTemplate.categoryFilters as any;
      if (consents) {
        const consentsValues = (consents['\\_consents\\'] as string[]) || [];
        if (consentsValues.length > 0) {
          query.authorizationFilters.push({
            conceptPath: '\\_consents\\',
            values: consentsValues,
          });
        }
        const harmonizedConsents = (consents['\\_harmonized_consent\\'] as string[]) || [];
        if (harmonizedConsents.length > 0) {
          query.authorizationFilters.push({
            conceptPath: '\\_harmonized_consent\\',
            values: harmonizedConsents,
          });
        }
        const topmedConsents = (consents['\\_topmed_consents\\'] as string[]) || [];
        if (topmedConsents.length > 0) {
          query.authorizationFilters.push({
            conceptPath: '\\_topmed_consents\\',
            values: topmedConsents,
          });
        }
      }
    }
  }

  if (features.requireConsents) {
    const hasHarmonizedInSelect = selectIncludesHarmonizedPathV3(query.select || []);
    const hasHarmonizedInPhenotype = phenotypicClauseIncludesHarmonizedPath(query.phenotypicClause);
    const hasAnyHarmonized = hasHarmonizedInSelect || hasHarmonizedInPhenotype;

    if (!hasAnyHarmonized) {
      query.authorizationFilters = (query.authorizationFilters || []).filter(
        (af) => af.conceptPath !== harmonizedConsentPath,
      );
    }

    const hasGenomic = (query.genomicFilters || []).length > 0;
    if (!hasGenomic) {
      query.authorizationFilters = (query.authorizationFilters || []).filter(
        (af) => af.conceptPath !== topmedConsentPath,
      );
    }
  }
}

const selectIncludesHarmonizedPathV3 = (arr: string[]): boolean => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};

const phenotypicClauseIncludesHarmonizedPath = (clause: PhenotypicClause | null): boolean => {
  if (!clause) return false;
  if (clause.type === 'PhenotypicFilter') {
    const filterClause = clause as PhenotypicFilterInterface;
    return !!filterClause.conceptPath && filterClause.conceptPath.includes(harmonizedPath);
  }
  const sub = clause as PhenotypicSubqueryInterface;
  return (sub.phenotypicClauses || []).some(phenotypicClauseIncludesHarmonizedPath);
};

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

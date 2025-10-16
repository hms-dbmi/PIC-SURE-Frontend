import {
  Query,
  type ExpectedResultType,
  type QueryInterface,
  QueryV3,
  type PhenotypicFilterInterface,
  type PhenotypicSubqueryInterface,
  type PhenotypicFilterType,
  type PhenotypicClause,
  Operator,
} from '$lib/models/query/Query';
import { features } from '$lib/configuration';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { FlatFilterTree } from '$lib/models/FlatTree';
import {
  filters,
  filterTree,
  genomicFilters,
  hasGenomicFilter,
  getFilterById,
} from '$lib/stores/Filter';
import { exports } from '$lib/stores/Export';
import { resources } from '$lib/stores/Resources';
import type {
  Filter,
  FilterType,
  GenomicFilterInterface,
  SnpFilterInterface,
} from '$lib/models/Filter';
import type { GenomicFilterInterfacev3 } from '$lib/models/query/Query';
import type { ExportInterface } from '$lib/models/Export.ts';

const harmonizedPath = '\\DCC Harmonized data set';
const harmonizedConsentPath = '\\_harmonized_consent\\';
const topmedConsentPath = '\\_topmed_consents\\';

export function getQueryRequest(
  addConsents = true,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
): QueryRequestInterface {
  let query: Query = new Query();
  if (features.useQueryTemplate && addConsents) {
    const queryTemplate: QueryInterface | undefined = get(user).queryTemplate;
    if (queryTemplate) {
      query = new Query(structuredClone(queryTemplate));
    }
  }

  get(filters).forEach((filter: Filter) => {
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

  if (features.requireConsents && addConsents) {
    query = updateConsentFilters(query);
  }

  query.expectedResultType = expectedResultType;

  return {
    query,
    resourceUUID,
  };
}

export function getBlankQueryRequest(
  isOpenAccess = false,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
): QueryRequestInterface {
  let query: Query = new Query();

  if (features.useQueryTemplate && !isOpenAccess) {
    const queryTemplate: QueryInterface = get(user).queryTemplate as QueryInterface;
    if (queryTemplate) {
      query = new Query(structuredClone(queryTemplate));
    }
  }

  if (features.requireConsents && !isOpenAccess) {
    query = updateConsentFilters(query);
  }

  query.expectedResultType = expectedResultType;

  return {
    query,
    resourceUUID,
  };
}

export const updateConsentFilters = (query: Query) => {
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

function getClausesFromFlatTree(tree: FlatFilterTree): PhenotypicClause {
  if (tree.operators.length === 0 && tree.filters.length === 1) {
    const filter = getFilterById(tree.filters[0]);
    const phenotypicClauses: PhenotypicFilterInterface[] = filter
      ? [convertPhenotypicFilterToClause(filter)]
      : [];
    const clause: PhenotypicClause = {
      type: 'PhenotypicSubquery',
      operator: Operator.AND,
      phenotypicClauses,
      not: false,
    };
    return clause;
  }

  const root: PhenotypicClause = {
    type: 'PhenotypicSubquery',
    operator: Operator.AND,
    phenotypicClauses: [],
    not: false,
  };
  let currentClause = root;

  tree.operators.forEach((operator, index) => {
    const filter = getFilterById(tree.filters[index]);
    if (filter) {
      const clause: PhenotypicFilterInterface = convertPhenotypicFilterToClause(filter);
      if (operator !== currentClause.operator) {
        // push to non-root operator group before switching to a new group
        if (operator === Operator.AND) {
          currentClause.phenotypicClauses.push(clause);
          currentClause = root;
        } else {
          const newClause: PhenotypicClause = {
            type: 'PhenotypicSubquery',
            operator: Operator.OR,
            phenotypicClauses: [],
            not: false,
          };
          root.phenotypicClauses.push(newClause);
          currentClause = newClause;
          currentClause.phenotypicClauses.push(clause);
        }
      } else {
        currentClause.phenotypicClauses.push(clause);
      }
    }
  });

  // Add last filter
  const lastFilter = getFilterById(tree.filters[tree.filters.length - 1]);
  if (lastFilter) {
    currentClause.phenotypicClauses.push(convertPhenotypicFilterToClause(lastFilter));
  }

  return root;
}

export function getQueryRequestV3(
  addConsents = true,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
) {
  const query: QueryV3 = new QueryV3();
  query.expectedResultType = expectedResultType;

  query.phenotypicClause = getClausesFromFlatTree(get(filterTree));
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

  if (query.expectedResultType !== 'CROSS_COUNT') {
    query.select = get(exports).map((field) => field.conceptPath);
  }

  if (addConsents) {
    addAuthorizationFiltersV3(query);
  }

  return {
    query: serializeQueryV3(query),
    resourceUUID,
  };
}

function addAuthorizationFiltersV3(query: QueryV3) {
  if (features.useQueryTemplate) {
    const queryTemplate: QueryInterface = get(user).queryTemplate as QueryInterface;
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
      newFilterClause.values = filter.concepts;
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

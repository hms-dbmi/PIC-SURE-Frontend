import {
  Query,
  type ExpectedResultType,
  type QueryInterface,
  QueryV3,
  type PhenotypicFilterInterface,
  type PhenotypicSubqueryInterface,
  type PhenotypicFilterType,
} from '$lib/models/query/Query';
import { features } from '$lib/configuration';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { filters, hasGenomicFilter } from '$lib/stores/Filter';
import { exports } from '$lib/stores/Export';
import { resources } from '$lib/stores/Resources';
import type {
  Filter,
  FilterType,
  GenomicFilterInterface,
  SnpFilterInterface,
} from '$lib/models/Filter';
import type { GenomicFilterInterfacev3 } from '$lib/models/query/Query';
import type { SNP } from '$lib/models/GenomeFilter';
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

  (get(filters) as Filter[]).forEach((filter: Filter) => {
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

const parseNumber = (input: string | number | null | undefined): number | undefined => {
  if (input === null || input === undefined) return undefined;
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;

  const trimmed = input.trim();
  if (trimmed === '') return undefined;

  // remove common grouping separators: comma, space, NBSP, thin space, underscore
  const normalized = trimmed.replace(/[,_\s\u00A0\u202F]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

export function getQueryRequestV3(
  addConsents = true,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
) {
  const query: QueryV3 = new QueryV3();

  if (expectedResultType !== 'CROSS_COUNT') {
    query.select = (get(exports) as ExportInterface[]).map((exportedField) => exportedField.conceptPath);
  }

  if (features.useQueryTemplate && addConsents) {
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

  const baseClause = {
    type: 'PhenotypicSubquery',
    operator: 'AND',
    phenotypicClauses: [],
    not: false,
  } as PhenotypicSubqueryInterface;
  const nonGenomicFilters = (get(filters) as Filter[]).filter((filter: Filter) => filter.filterType !== 'genomic' && filter.filterType !== 'snp');
  nonGenomicFilters.forEach((filter: Filter) => {
      const newFilterClause = {
        type: 'PhenotypicFilter',
        phenotypicFilterType: convertFilterTypeToClauseType(filter.filterType),
        conceptPath: filter.id,
        not: false,
      } as PhenotypicFilterInterface;
      if (filter.filterType === 'AnyRecordOf') {
        newFilterClause.phenotypicFilterType = 'ANY_RECORD_OF';
        newFilterClause.conceptPath = filter.id;
        newFilterClause.values = filter.concepts;
      } else if (filter.filterType === 'required') {
        newFilterClause.phenotypicFilterType = 'REQUIRED';
      } else if (filter.filterType === 'numeric') {
        if (filter.min !== undefined && filter.max !== undefined) {
          newFilterClause.min = parseNumber(filter.min);
          newFilterClause.max = parseNumber(filter.max);
        } else {
          newFilterClause.phenotypicFilterType = 'REQUIRED';
        }
      } else if (filter.filterType === 'Categorical') {
        if (filter.categoryValues === undefined || filter.categoryValues.length === 0) {
          newFilterClause.phenotypicFilterType = 'REQUIRED';
        } else {
          newFilterClause.values = filter?.categoryValues || undefined;
        }
      }
      if (filter.filterType === 'required') {
        newFilterClause.phenotypicFilterType = 'REQUIRED';
      } else if (filter.filterType === 'numeric') {
        if (filter.min !== undefined && filter.max !== undefined) {
          newFilterClause.min = Number(filter.min) || undefined;
          newFilterClause.max = Number(filter.max) || undefined;
        } else {
          newFilterClause.phenotypicFilterType = 'REQUIRED';
        }
      }
      baseClause.phenotypicClauses.push(newFilterClause);
    });

  (get(filters) as Filter[])
    .filter((filter: Filter) => filter.filterType === 'genomic')
    .forEach((filter: Filter) => {
      const genomicFilters = convertGenomicFilterToClause(filter as GenomicFilterInterface);
      genomicFilters.forEach((genomicFilter) => {
        query.genomicFilters.push(genomicFilter);
      });
    });

  (get(filters) as Filter[])
    .filter((filter: Filter) => filter.filterType === 'snp')
    .forEach((filter: Filter) => {
      const genomicFilters = convertSnpFilterToClause(
        (filter as SnpFilterInterface).snpValues || [],
      );
      genomicFilters.forEach((genomicFilter) => {
        query.genomicFilters.push(genomicFilter);
      });
    });
  if (nonGenomicFilters.length > 0) {
    query.phenotypicClause = baseClause;
  }
  query.expectedResultType = expectedResultType;

  const serializedQuery = JSON.parse(
    JSON.stringify(query, (key, value) => {
      if (key === 'type') return undefined;
      return value;
    }),
  );
  return {
    query: serializedQuery,
    resourceUUID,
  };
}

const convertGenomicFilterToClause = (
  filter: GenomicFilterInterface,
): GenomicFilterInterfacev3[] => {
  const genomicFilters: GenomicFilterInterfacev3[] = [];

  // Check if this is a numeric genomic filter (has min/max but no categorical values)
  const hasMinMax =
    (filter.min !== undefined && filter.min !== '') ||
    (filter.max !== undefined && filter.max !== '');
  const hasCategoricalValues =
    (filter.Gene_with_variant && filter.Gene_with_variant.length > 0) ||
    (filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0) ||
    (filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0);

  if (hasMinMax && !hasCategoricalValues) {
    // This is a numeric genomic filter
    const min = filter.min ? Number(filter.min) : undefined;
    const max = filter.max ? Number(filter.max) : undefined;
    return convertNumericGenomicFilterToClause('genomic_range', min, max);
  }

  // This is a categorical genomic filter
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

const convertSnpFilterToClause = (snps: SNP[]): GenomicFilterInterfacev3[] => {
  const genomicFilters: GenomicFilterInterfacev3[] = [];

  snps.forEach((snp) => {
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
  // For future use when numeric genomic filters are implemented in the UI
  // This would handle cases where genomic filters have min/max values instead of categorical values
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

/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-enable @typescript-eslint/no-explicit-any */
const hasHarmonizedPath = (obj: object): boolean => {
  return Object.keys(obj).some((concept) => concept.includes(harmonizedPath));
};

const fieldsIncludeHarmonizedPath = (arr: string[]): boolean => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};

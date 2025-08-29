import { Query, type ExpectedResultType, type QueryInterface } from '$lib/models/query/Query';
import { features } from '$lib/stores/Configuration';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { filters, hasGenomicFilter } from '$lib/stores/Filter';
import { exports } from '$lib/stores/Export';
import { resources } from '$lib/stores/Resources';
import type { Filter } from '$lib/models/Filter';
import type { ExportInterface } from '$lib/models/Export.ts';

const harmonizedPath = '\\DCC Harmonized data set';
const harmonizedConsentPath = '\\_harmonized_consent\\';
const topmedConsentPath = '\\_topmed_consents\\';

export function getQueryRequest(
  addConsents = true,
  resourceUUID = get(resources).hpdsAuth,
  expectedResultType: ExpectedResultType = 'COUNT',
): QueryRequestInterface {
  const _features = get(features);
  let query: Query = new Query();
  if (_features.useQueryTemplate && addConsents) {
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

  if (_features.requireConsents && addConsents) {
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
  const _features = get(features);
  let query: Query = new Query();

  if (_features.useQueryTemplate && !isOpenAccess) {
    const queryTemplate: QueryInterface = get(user).queryTemplate as QueryInterface;
    if (queryTemplate) {
      query = new Query(structuredClone(queryTemplate));
    }
  }

  if (_features.requireConsents && !isOpenAccess) {
    query = updateConsentFilters(query);
  }

  query.expectedResultType = expectedResultType;

  return {
    query,
    resourceUUID,
  };
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

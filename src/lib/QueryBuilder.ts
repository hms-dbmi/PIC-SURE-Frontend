import { Query, type ExpectedResultType, type QueryInterface } from '$lib/models/query/Query';
import { features, resources } from '$lib/configuration';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { filters, hasGenomicFilter } from '$lib/stores/Filter';
import type { Filter } from '$lib/models/Filter';

const harmonizedPath = '\\DCC Harmonized data set';
const harmonizedConsentPath = '\\_harmonized_consent\\';
const topmedConsentPath = '\\_topmed_consents\\';

export function getQueryRequest(
  addConsents = true,
  resourceUUID = resources.hpds,
  expectedResultType: ExpectedResultType = 'COUNT',
): QueryRequestInterface {
  let query: Query = new Query();
  if (features.useQueryTemplate && addConsents) {
    const queryTemplate: QueryInterface | undefined = get(user).queryTemplate;
    if (queryTemplate) {
      query = new Query(structuredClone(queryTemplate));
    }
  }

  (get(filters) as Filter[]).forEach((filter) => {
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
  addConsents = true,
  resourceUUID = resources.hpds,
  expectedResultType: ExpectedResultType = 'COUNT',
): QueryRequestInterface {
  let query: Query = new Query();

  if (features.useQueryTemplate && addConsents) {
    const queryTemplate: QueryInterface = get(user).queryTemplate as QueryInterface;
    if (queryTemplate) {
      query = new Query(queryTemplate);
    }
  }

  if (features.requireConsents && addConsents) {
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
    console.debug('removing topmed consent');
    query.removeCategoryFilter(topmedConsentPath);
  } else {
    // check if the category filter is not an empty object
    if (Object.keys(query.categoryFilters).length !== 0) {
      // log category filters
      console.debug('category filters:', query.categoryFilters);
      // if the filters contain topmed consent log it. If not log a message that it is not present
      if (Object.keys(query.categoryFilters).includes(topmedConsentPath)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const topmedConsent = query.categoryFilters[topmedConsentPath];
        console.debug('topmed consent filter:', topmedConsent);
      } else {
        console.debug('topmed consent filter not present');
      }
    }
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

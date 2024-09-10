import { Query } from '$lib/models/query/Query';
import { features, resources } from '$lib/configuration';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { get } from 'svelte/store';
import { user } from '$lib/stores/User';
import { filters } from '$lib/stores/Filter';
import type { Filter } from '$lib/models/Filter';

const harmonizedPath = '\\DCC Harmonized data set';
const harmonizedConsentPath = '\\_harmonized_consent\\';
const topmedConsentPath = '\\_topmed_consents\\';

export function getQueryRequest(openAccess = false): QueryRequestInterface {
  let resourceUUID = resources.hpds;
  let query = new Query();
  if (features.useQueryTemplate) {
    const queryTemplate = get(user).queryTemplate;
    if (queryTemplate) {
      query = new Query(queryTemplate);
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

  if (features.requireConsents) {
    query = updateConsentFilters(query);
  }

  if (openAccess) {
    resourceUUID = resources.openHPDS;
  }

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

  let topmedPresent = false;
  if (
    query.variantInfoFilters.length &&
    Object.keys(query.variantInfoFilters[0].categoryVariantInfoFilters as any).length > 0
  ) {
    topmedPresent = true;
  }

  if (
    query.variantInfoFilters.length &&
    Object.keys(query.variantInfoFilters[0].numericVariantInfoFilters as any).length > 0
  ) {
    topmedPresent = true;
  }

  if (!topmedPresent) {
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

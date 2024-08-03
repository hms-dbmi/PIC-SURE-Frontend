import { get, derived, writable, type Readable, type Writable } from 'svelte/store';

import { resources } from '$lib/configuration';
import type { Filter } from '$lib/models/Filter';
import type { QueryRequestInterface } from '$lib/models/api/Request';
import { Query } from '$lib/models/query/Query';

const filters: Writable<Filter[]> = writable([]);
const totalParticipants: Writable<number> = writable(0);
const hasGenomicFilter: Readable<boolean> = derived(filters, ($f) =>
  $f.find((filter) => filter.filterType === 'genomic') ? true : false,
);

export function addFilter(filter: Filter) {
  const currentFilters = get(filters);
  currentFilters.forEach((f) => {
    if (f.variableName === filter.variableName) {
      currentFilters.splice(currentFilters.indexOf(f), 1);
    }
  });
  filters.set([...currentFilters, filter]);
  return filter;
}

export function removeFilter(uuid: string) {
  const currentFilters = get(filters);
  filters.set(currentFilters.filter((f) => f.uuid !== uuid));
}

function clearFilters() {
  filters.set([]);
}

function setFilters(newFilters: Filter[]) {
  filters.set(newFilters);
}

export function getFilter(uuid: string) {
  return get(filters).find((f) => f.uuid === uuid);
}

export function getFiltersByType(type: string) {
  return get(filters).filter((f) => f.filterType === type);
}

function getQueryRequest(): QueryRequestInterface {
  const newQuery = new Query();
  
  get(filters).forEach((filter) => {

    if (filter.filterType === 'Categorical') {
      
      if (filter.displayType === 'restrict') {
        newQuery.addCategoryFilter(filter.id, filter.categoryValues);
      } else {
        newQuery.addRequiredField(filter.id);
      
      }
    } else if (filter.filterType === 'numeric') {
      
      newQuery.addNumericFilter(filter.id, filter.min || '', filter.max || '');
    
    } else if (filter.filterType === 'genomic') {
      
      newQuery.addCategoryVariantInfoFilters({
        Gene_with_variant: filter.Gene_with_variant,
        Variant_consequence_calculated: filter.Variant_consequence_calculated,
        Variant_frequency_as_text: filter.Variant_frequency_as_text,
      });
    
    } else if (filter.filterType === 'snp') {
      newQuery.addSnpFilter(filter.snpValues);
    }
  });

  return {
    query: newQuery,
    resourceUUID: resources.hpds,
  };
}

export default {
  subscribe: filters.subscribe,
  filters,
  hasGenomicFilter,
  addFilter,
  removeFilter,
  clearFilters,
  setFilters,
  getFilter,
  getQueryRequest,
  totalParticipants,
};

//TODO: CLEAN UP

import { get, derived, writable, type Readable, type Writable } from 'svelte/store';

import type { Filter } from '$lib/models/Filter';

export const filters: Writable<Filter[]> = writable([]);
export const totalParticipants: Writable<number | string> = writable(0);
export const hasGenomicFilter: Readable<boolean> = derived(filters, ($f) =>
  $f.find((filter) => filter.filterType === 'genomic') ? true : false,
);
export const hasUnallowedFilter: Readable<boolean> = derived(filters, ($f) =>
  $f.find((filter) => !filter.allowFiltering) ? true : false,
);

export function addFilter(filter: Filter) {
  const currentFilters = get(filters);
  console.log(currentFilters, filter);
  currentFilters.forEach((f) => {
    if (f.id === filter.id) {
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
export function removeGenomicFilters() {
  const currentFilters = get(filters);
  filters.set(currentFilters.filter((f) => f.filterType !== 'genomic'));
}
export function removeUnallowedFilters() {
  const currentFilters = get(filters);
  filters.set(currentFilters.filter((f) => f.allowFiltering));
}

export function clearFilters() {
  filters.set([]);
}

export function getFilter(uuid: string) {
  return get(filters).find((f) => f.uuid === uuid);
}

export function getFiltersByType(type: string) {
  return get(filters).filter((f) => f.filterType === type);
}

filters.subscribe((filterArray) => {
  localStorage.setItem('filters', JSON.stringify(filterArray));
});

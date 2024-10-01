import { get, derived, writable, type Readable, type Writable } from 'svelte/store';

import type { Filter } from '$lib/models/Filter';
import { browser } from '$app/environment';
import { user } from './User';

export const filters: Writable<Filter[]> = writable(restoreFilters());
export const totalParticipants: Writable<number | string> = writable(0);
export const hasGenomicFilter: Readable<boolean> = derived(filters, ($f) =>
  $f && $f.length > 0 ? $f.some((filter) => filter.filterType === 'genomic') : false,
);
export const hasUnallowedFilter: Readable<boolean> = derived(filters, ($f) =>
  $f && $f.length > 0 ? $f.some((filter) => !filter.allowFiltering) : false,
);

export const hasInvalidFilter: Readable<boolean> = derived([user, filters], ([$user, $filters]) => {
  if ($filters.length === 0) return false;

  return $filters.some((filter) => {
    const filterDataset = filter.dataset || '';

    const isValidFilter = $user?.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });

    return !isValidFilter;
  });
});

filters.subscribe((f) => {
  if (browser) {
    sessionStorage.setItem('filters', JSON.stringify(f));
  }
});

function restoreFilters() {
  if (browser && sessionStorage.getItem('filters')) {
    return JSON.parse(sessionStorage.getItem('filters') || '[]');
  }
  return [];
}

export function addFilter(filter: Filter) {
  const currentFilters = get(filters);
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

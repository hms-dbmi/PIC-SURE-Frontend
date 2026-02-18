import { get, derived, writable, type Readable, type Writable } from 'svelte/store';

import type { Filter } from '$lib/models/Filter';
import type { SearchResult } from '$lib/models/Search';
import { browser } from '$app/environment';
import { user } from './User';
import { objectUUID } from '$lib/utilities/UUID';

export const filters: Writable<Filter[]> = writable(restoreFilters());
export const associatedStudies: Readable<string[]> = derived(filters, ($f) => {
  const studies = new Set<string>();
  for (const filter of $f) {
    if (filter.dataset) studies.add(filter.dataset);
  }
  return [...studies];
});
export const hasGenomicFilter: Readable<boolean> = derived(filters, ($f) =>
  $f && $f.length > 0 ? $f.some((filter) => filter.filterType === 'genomic') : false,
);
export const hasUnallowedFilter: Readable<boolean> = derived(filters, ($f) =>
  $f && $f.length > 0 ? $f.some((filter) => !filter.allowFiltering) : false,
);

export const hasInvalidFilter: Readable<boolean> = derived([user, filters], ([$user, $filters]) => {
  if ($filters.length === 0 || !$user?.queryScopes) return false;

  return $filters.some((filter) => {
    let filterDataset = filter.dataset || '';
    if (filter.filterType === 'genomic' || filter.filterType === 'snp') {
      filterDataset = 'Gene_with_variant';
    }

    const isValidFilter = $user?.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });

    return !isValidFilter;
  });
});

// modal data
export const activeFilter: Writable<Filter | undefined> = writable();
export const activeSearch: Writable<SearchResult | undefined> = writable();
export const filterWarning: Writable<string | undefined> = writable();

filters.subscribe((f) => {
  if (browser) {
    sessionStorage.setItem('filters', JSON.stringify(f));
  }
});

function restoreFilters() {
  if (browser && sessionStorage.getItem('filters')) {
    const oldFilters: Filter[] = JSON.parse(sessionStorage.getItem('filters') || '[]');
    return oldFilters.map((filter) => ({ ...filter, uuid: objectUUID(filter) }));
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
  filter.uuid = objectUUID(filter);
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

export function removeInvalidFilters(): void {
  const currentUser = get(user);
  const currentFilters = get(filters);

  if (!currentUser || currentFilters.length === 0) return;

  const validFilters = currentFilters.filter((filter) => {
    let filterDataset = filter.dataset || '';
    if (filter.filterType === 'genomic' || filter.filterType === 'snp') {
      filterDataset = 'Gene_with_variant';
    }

    const isValidFilter = currentUser.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });

    return isValidFilter;
  });

  filters.set(validFilters);
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

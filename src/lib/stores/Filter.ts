import { get, derived, writable, type Readable, type Writable } from 'svelte/store';
import * as uuid from 'uuid';

import type { Filter, FilterMap } from '$lib/models/Filter';
import type { SearchResult } from '$lib/models/Search';
import { browser } from '$app/environment';
import { user } from './User';

const SESSION_NAMESPACE = uuid.v4();

export const filterMap: Writable<FilterMap> = writable(restoreFilters());
export const filters: Readable<Filter[]> = derived(filterMap, ($filterMap) => Object.values($filterMap).sort());

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

function generateFilterMap(filters: Filter[]):FilterMap {
  return filters.reduce((map: FilterMap, filter: Filter) => { map[filter.uuid] = filter; return map }, {})
}

function restoreFilters():FilterMap {
  if (browser && sessionStorage.getItem('filters')) {
    const oldFilters: Filter[] = JSON.parse(sessionStorage.getItem('filters') || '[]');
    return generateFilterMap(oldFilters.map((filter) => ({ ...filter, uuid: filterUUID(filter) })));
  }
  return {};
}

function filterUUID(filter: Filter):string {
  return uuid.v5(JSON.stringify({ ...filter, uuid: undefined }), SESSION_NAMESPACE);
}

export function addFilter(filter: Filter):Filter {
  const currentFilters = get(filters).filter(f => f.id !== filter.id);
  currentFilters.push({ ...filter, uuid: filterUUID(filter) });
  filterMap.set(generateFilterMap(currentFilters));
  return filter;
}

export function removeFilter(uuid: string):void {
  const map = { ...get(filterMap) };
  delete map[uuid];
  filterMap.set(map);
}

export function removeGenomicFilters():void {
  const currentFilters = get(filters).filter((f) => f.filterType !== 'genomic');
  filterMap.set(generateFilterMap(currentFilters));
}

export function removeUnallowedFilters():void {
  const currentFilters = get(filters).filter((f) => f.allowFiltering);
  filterMap.set(generateFilterMap(currentFilters));
}

export function removeInvalidFilters():void {
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

  filterMap.set(generateFilterMap(validFilters));
}

export function clearFilters():void {
  filterMap.set({});
}

export function setFilters(filters: Filter[]):void {
  filterMap.set(generateFilterMap(filters));
}

export function getFilter(uuid: string):Filter {
  return get(filterMap)[uuid];
}

export function getFiltersByType(type: string):Filter[] {
  return get(filters).filter((f) => f.filterType === type);
}

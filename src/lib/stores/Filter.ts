import { get, derived, writable, type Readable, type Writable } from 'svelte/store';
import * as uuid from 'uuid';

import type { Filter } from '$lib/models/Filter';
import type { SearchResult } from '$lib/models/Search';
import { FlatFilterTree } from '$lib/models/FlatTree';
import { browser } from '$app/environment';
import { user } from './User';
import type { Operator } from '$lib/models/query/Query';

const SESSION_NAMESPACE = uuid.v4();
const genomicFilterTypes = ['snp', 'genomic'];

export const filters: Writable<Filter[]> = writable(restoreFilters());
export const genomicFilters: Readable<Filter[]> = derived(filters, ($f) =>
  $f.filter((f) => genomicFilterTypes.includes(f.filterType)),
);
export const phenotypicFilters: Readable<Filter[]> = derived(filters, ($f) =>
  $f.filter((f) => !genomicFilterTypes.includes(f.filterType)),
);
export const filterTree: Writable<FlatFilterTree> = writable(restoreFilterTree());
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
    if (genomicFilterTypes.includes(filter.filterType)) {
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

filters.subscribe((filterList: Filter[]) => {
  if (browser) {
    sessionStorage.setItem('filters', JSON.stringify(filterList));
  }
});

phenotypicFilters.subscribe((filterList: Filter[]) => {
  // Update filter tree
  const tree: FlatFilterTree = get(filterTree);
  const ids: string[] = filterList.map((filter) => filter.id);

  const newFilters = ids.filter((id) => !tree.filters.includes(id));
  const removedFilters = tree.filters.filter((id) => !ids.includes(id));

  if (newFilters.length > 0 || removedFilters.length > 0) {
    newFilters.length > 0 && tree.add(...newFilters);
    removedFilters.length > 0 && tree.remove(...removedFilters);
    filterTree.set(tree);

    if (browser) {
      sessionStorage.setItem('filterTree', JSON.stringify(tree));
    }
  }
});

function restoreFilterTree(): FlatFilterTree {
  if (browser && sessionStorage.getItem('filterTree')) {
    const oldTree: { operators: Operator[]; filters: string[] } = JSON.parse(
      sessionStorage.getItem('filterTree') || '{filters:[],operators:[]}',
    );
    return new FlatFilterTree(oldTree.filters, oldTree.operators);
  }
  return new FlatFilterTree();
}

function restoreFilters(): Filter[] {
  if (browser && sessionStorage.getItem('filters')) {
    const oldFilters: Filter[] = JSON.parse(sessionStorage.getItem('filters') || '[]');
    return oldFilters.map((filter) => ({ ...filter, uuid: filterUUID(filter) }));
  }
  return [];
}

function filterUUID(filter: Filter) {
  return uuid.v5(JSON.stringify({ ...filter, uuid: undefined }), SESSION_NAMESPACE);
}

export function addFilter(filter: Filter) {
  const currentFilters = get(filters);
  currentFilters.forEach((f) => {
    if (f.id === filter.id) {
      currentFilters.splice(currentFilters.indexOf(f), 1);
    }
  });
  filter.uuid = filterUUID(filter);
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
    if (genomicFilterTypes.includes(filter.filterType)) {
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

export function getFilterById(id: string) {
  return get(filters).find((f) => f.id === id);
}

export function getFiltersByType(type: string) {
  return get(filters).filter((f) => f.filterType === type);
}

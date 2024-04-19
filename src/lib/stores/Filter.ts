import { get, writable, type Writable } from 'svelte/store';

import type { Filter } from '$lib/models/Filter';

const filters: Writable<Filter[]> = writable([]);

function addFilter(filter: Filter) {
  const currentFilters = get(filters);
  currentFilters.forEach((f) => {
    if (f.variableName === filter.variableName) {
      currentFilters.splice(currentFilters.indexOf(f), 1);
    }
  });
  filters.set([...currentFilters, filter]);
  return filter;
}

function removeFilter(uuid: string) {
  const currentFilters = get(filters);
  filters.set(currentFilters.filter((f) => f.uuid !== uuid));
}

function clearFilters() {
  filters.set([]);
}

function setFilters(newFilters: Filter[]) {
  filters.set(newFilters);
}

function getFilter(uuid: string) {
  return get(filters).find((f) => f.uuid === uuid);
}

export default {
  subscribe: filters.subscribe,
  filters,
  addFilter,
  removeFilter,
  clearFilters,
  setFilters,
  getFilter,
};

//TODO: CLEAN UP

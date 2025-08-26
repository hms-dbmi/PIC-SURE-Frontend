import { w as writable, h as get, i as derived } from './exports-Cnt0TmSD.js';
import * as uuid from 'uuid';
import { u as user } from './User-ByrNDeqq.js';

uuid.v4();
const filters = writable(restoreFilters());
const hasGenomicFilter = derived(
  filters,
  ($f) => $f && $f.length > 0 ? $f.some((filter) => filter.filterType === "genomic") : false
);
derived(
  filters,
  ($f) => $f && $f.length > 0 ? $f.some((filter) => !filter.allowFiltering) : false
);
derived([user, filters], ([$user, $filters]) => {
  if ($filters.length === 0 || !$user?.queryScopes) return false;
  return $filters.some((filter) => {
    let filterDataset = filter.dataset || "";
    if (filter.filterType === "genomic" || filter.filterType === "snp") {
      filterDataset = "Gene_with_variant";
    }
    const isValidFilter = $user?.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });
    return !isValidFilter;
  });
});
const filterWarning = writable();
filters.subscribe((f) => {
});
function restoreFilters() {
  return [];
}
function removeGenomicFilters() {
  const currentFilters = get(filters);
  filters.set(currentFilters.filter((f) => f.filterType !== "genomic"));
}
function removeUnallowedFilters() {
  const currentFilters = get(filters);
  filters.set(currentFilters.filter((f) => f.allowFiltering));
}
function removeInvalidFilters() {
  const currentUser = get(user);
  const currentFilters = get(filters);
  if (!currentUser || currentFilters.length === 0) return;
  const validFilters = currentFilters.filter((filter) => {
    let filterDataset = filter.dataset || "";
    if (filter.filterType === "genomic" || filter.filterType === "snp") {
      filterDataset = "Gene_with_variant";
    }
    const isValidFilter = currentUser.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });
    return isValidFilter;
  });
  filters.set(validFilters);
}
function clearFilters() {
  filters.set([]);
}
function getFiltersByType(type) {
  return get(filters).filter((f) => f.filterType === type);
}

export { removeGenomicFilters as a, removeUnallowedFilters as b, filters as c, clearFilters as d, filterWarning as f, getFiltersByType as g, hasGenomicFilter as h, removeInvalidFilters as r };
//# sourceMappingURL=Filter-BUwQwcV6.js.map

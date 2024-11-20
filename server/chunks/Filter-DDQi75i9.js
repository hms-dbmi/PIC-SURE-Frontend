import { d as derived, w as writable } from './index2-BVONNh3m.js';
import { u as user } from './User-Dh89vg_C.js';

const filters = writable(restoreFilters());
const totalParticipants = writable(0);
const hasGenomicFilter = derived(
  filters,
  ($f) => $f && $f.length > 0 ? $f.some((filter) => filter.filterType === "genomic") : false
);
const hasUnallowedFilter = derived(
  filters,
  ($f) => $f && $f.length > 0 ? $f.some((filter) => !filter.allowFiltering) : false
);
const hasInvalidFilter = derived([user, filters], ([$user, $filters]) => {
  if ($filters.length === 0) return false;
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
filters.subscribe((f) => {
});
function restoreFilters() {
  return [];
}
function clearFilters() {
  filters.set([]);
}

export { hasGenomicFilter as a, hasInvalidFilter as b, clearFilters as c, filters as f, hasUnallowedFilter as h, totalParticipants as t };
//# sourceMappingURL=Filter-DDQi75i9.js.map

import { w as writable } from './index2-BVONNh3m.js';
import { s as searchDictionary } from './dictionary-BCWDtCUQ.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

const loading = writable(
  Promise.resolve(void 0)
);
const searchTerm = writable("");
const selectedFacets = writable([]);
const error = writable("");
async function search(searchTerm2, facets, state) {
  if (!searchTerm2 && (!facets || !facets.length)) {
    state?.setTotalRows(0);
    return [];
  }
  const search2 = searchDictionary(searchTerm2.trim(), facets, {
    pageNumber: state?.pageNumber ? state?.pageNumber - 1 : 0,
    pageSize: state?.rowsPerPage
  });
  loading.set(search2);
  const response = await search2.catch((e) => {
    console.error(e);
    state?.setTotalRows(0);
    error.set(
      "An error occurred while searching. If the problem persists, please contact an administrator."
    );
    throw e;
  });
  if (!response) {
    error.set(
      "An error occurred while searching. If the problem persists, please contact an administrator."
    );
  }
  state?.setTotalRows(response?.totalElements ?? 0);
  return response?.content ?? [];
}
async function updateFacets(facetsToUpdate) {
  const currentFacets = get_store_value(selectedFacets);
  facetsToUpdate.forEach((facet) => {
    const facetIndex = currentFacets.findIndex((f) => f.name === facet.name);
    if (facetIndex !== -1) {
      currentFacets.splice(facetIndex, 1);
    } else {
      currentFacets.push(facet);
    }
  });
  selectedFacets.set(currentFacets.sort((a, b) => b.count - a.count));
}
function resetSearch() {
  searchTerm.set("");
  selectedFacets.set([]);
  error.set("");
}
const SearchStore = {
  selectedFacets,
  searchTerm,
  error,
  search,
  updateFacets,
  resetSearch
};

export { SearchStore as S, searchTerm as a, loading as l, selectedFacets as s };
//# sourceMappingURL=Search-Bp0u75kz.js.map

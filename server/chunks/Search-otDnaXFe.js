import { w as writable } from './index2-CV6P_ZFI.js';
import { s as searchDictionary } from './dictionary--3HNnv1h.js';
import { g as get_store_value } from './lifecycle-GVhEEkqU.js';

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
  try {
    const search2 = searchDictionary(searchTerm2.trim(), facets, {
      pageNumber: state?.pageNumber ? state?.pageNumber - 1 : 0,
      pageSize: state?.rowsPerPage
    });
    loading.set(search2);
    const response = await search2;
    state?.setTotalRows(response.totalElements);
    return response.content;
  } catch (e) {
    console.error(e);
    error.set(
      "An error occurred while searching. If the problem persists, please contact an administrator."
    );
    state?.setTotalRows(0);
    return [];
  }
}
async function updateFacet(newFacet, facetCategory) {
  if (facetCategory) {
    newFacet.categoryRef = {
      display: facetCategory.display,
      name: facetCategory.name,
      description: facetCategory.description
    };
  }
  try {
    selectedFacets.update((facets) => {
      const index = facets.findIndex((facet) => facet.name === newFacet.name);
      if (index === -1) {
        facets.push(newFacet);
      } else {
        facets.splice(index, 1);
      }
      selectedFacets.set(get_store_value(selectedFacets).sort((a, b) => b.count - a.count));
      return facets;
    });
  } catch (e) {
    console.error(e);
    return;
  }
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
  updateFacet,
  resetSearch
};

export { SearchStore as S, searchTerm as a, loading as l, selectedFacets as s };
//# sourceMappingURL=Search-otDnaXFe.js.map

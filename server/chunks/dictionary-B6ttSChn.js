import { p as post, u as user } from './User-D2U6RL_p.js';
import { p as page } from './stores3-BdNELvYD.js';
import { w as writable } from './index2-Bx7ZSImw.js';
import { g as get_store_value } from './utils-EiTRXYbg.js';

const dictionaryUrl = "picsure/proxy/dictionary-api/";
const searchUrl = "picsure/proxy/dictionary-api/concepts";
const hiddenFacets = writable({});
function searchDictionary(searchTerm = "", facets, pageable) {
  let request = { facets, search: searchTerm };
  if (!get_store_value(page).url.pathname.includes("/discover")) {
    request = addConsents(request);
  }
  return post(
    `${searchUrl}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    request
  );
}
function addConsents(request) {
  const queryTemplate = get_store_value(user)?.queryTemplate;
  if (queryTemplate) {
    const filters = queryTemplate.categoryFilters;
    const consents = filters["\\_consents\\"];
    request.consents = consents;
  }
  return request;
}
async function getConceptCount(isOpenAccess = false) {
  let request = { facets: [], search: "", consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  const res = await post(`${searchUrl}?page_number=1&page_size=1`, request);
  return res.totalElements;
}
async function getStudiesCount(isOpenAccess = false) {
  let request = { facets: [], search: "", consents: [] };
  if (!isOpenAccess) {
    request = addConsents(request);
  }
  const res = await post(`${dictionaryUrl}facets/`, request);
  const facetCat = res.find((facetCat2) => facetCat2.name === "dataset_id");
  if (!facetCat) {
    return 0;
  }
  if (isOpenAccess) {
    return facetCat.facets.length;
  }
  const facetsForUser = facetCat.facets.filter((facet) => facet.count > 0);
  return facetsForUser.length;
}

export { getConceptCount as a, getStudiesCount as g, hiddenFacets as h, searchDictionary as s };
//# sourceMappingURL=dictionary-B6ttSChn.js.map

import { w as writable, l as get } from './utils-D3IkxnGP.js';
import { $ as loadResources, a0 as loading, a1 as isToastShowing, t as toaster } from './User-CeJunCPd.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { g as getResultList, S as StatPromise, c as countResult } from './StatBuilder-C-7IIq7L.js';
import { j as genomicFilters, c as filters, e as advancedFilteringEnabled } from './Filter-DSKDPPqy.js';
import { s as searchTerm, a as selectedFacets } from './Dictionary-Cym6J1qH.js';

const CACHE_MAX_ENTRIES = 100;
const requestCache = /* @__PURE__ */ new Map();
const hasNonZeroResult = writable(false);
const resultCounts = writable([]);
writable(Promise.resolve());
const countsLoading = writable(false);
const totalParticipants = writable(0);
async function loadPatientCount(isOpenAccess) {
  loadResources();
  try {
    if (requestCache.size >= CACHE_MAX_ENTRIES) {
      requestCache.clear();
    }
    const cacheKey = JSON.stringify([
      isOpenAccess,
      get(searchTerm),
      get(selectedFacets).map((facet) => facet.name),
      get(genomicFilters).map(({ uuid }) => uuid),
      // if operator changes we need to redo query
      get(filters).map(({ uuid, parent }) => uuid + parent?.operator),
      // if advanced filtering toggle changes, query version changes (V2 vs V3)
      get(advancedFilteringEnabled)
    ]);
    if (requestCache.has(cacheKey)) {
      resultCounts.set(requestCache.get(cacheKey));
      countsLoading.set(false);
      return;
    }
    await get(loading);
    const resultStats = getResultList(isOpenAccess, branding?.results?.stats || []);
    resultCounts.set(resultStats);
    countsLoading.set(true);
    Promise.allSettled(resultStats.flatMap(StatPromise.list).map(({ promise }) => promise)).then(
      (results) => {
        if (!results.some(StatPromise.rejected)) {
          requestCache.set(cacheKey, resultStats);
        }
        hasNonZeroResult.set(
          results.some(
            (result) => StatPromise.fullfiled(result) && `${countResult([result.value])}` !== "0"
          )
        );
        countsLoading.set(false);
      }
    );
    const totalCount = resultStats.find((count) => count.key === branding?.results?.totalStatKey);
    if (totalCount) {
      Promise.allSettled(StatPromise.list(totalCount).map(({ promise }) => promise)).then(
        (results) => {
          const values = results.filter(StatPromise.fullfiled).map(({ value }) => value);
          totalParticipants.set(countResult(values, false));
        }
      );
    }
  } catch (error) {
    console.error(error);
    countsLoading.set(false);
    if (!isToastShowing("query-error")) {
      toaster.error({
        id: "query-error",
        duration: 4e3,
        title: "An error occured while loading patient counts. If this problem persists, please contact an administrator.",
        closable: true
      });
    }
  }
}

export { countsLoading as c, hasNonZeroResult as h, loadPatientCount as l, resultCounts as r, totalParticipants as t };
//# sourceMappingURL=ResultStore-CEb6_EKn.js.map

import { get, writable, type Writable } from 'svelte/store';

import { isToastShowing, toaster } from '$lib/toaster';
import { branding } from '$lib/configuration';
import { getResultList, StatPromise } from '$lib/utilities/StatBuilder';
import { countResult } from '$lib/utilities/PatientCount';

import type { StatResult, StatValue } from '$lib/models/Stat';
import { filters, genomicFilters, advancedFilteringEnabled } from '$lib/stores/Filter';
import { searchTerm, selectedFacets } from '$lib/stores/Search';
import { loading as resourcesPromise, loadResources } from '$lib/stores/Resources';
import { features } from '$lib/configuration';

const CACHE_MAX_ENTRIES = 100;
const requestCache: Map<string, StatResult[]> = new Map();
export const hasNonZeroResult: Writable<boolean> = writable(false);
export const resultCounts: Writable<StatResult[]> = writable([]);
export const loading: Writable<Promise<void>> = writable(Promise.resolve());
export const countsLoading: Writable<boolean> = writable(false);
export const totalParticipants: Writable<number> = writable(0);

export async function loadPatientCount(useAuth: boolean) {
  const isOpenAccess = !useAuth && !features.explorer.open && features.discover;
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
      get(advancedFilteringEnabled),
    ]);
    if (requestCache.has(cacheKey)) {
      resultCounts.set(requestCache.get(cacheKey) as StatResult[]);
      countsLoading.set(false);
      return;
    }

    await get(resourcesPromise);
    const resultStats: StatResult[] = getResultList(isOpenAccess, branding?.results?.stats || []);
    resultCounts.set(resultStats);
    countsLoading.set(true);
    Promise.allSettled(resultStats.flatMap(StatPromise.list).map(({ promise }) => promise)).then(
      (results) => {
        if (!results.some(StatPromise.rejected)) {
          // Cache if no rejected requests
          requestCache.set(cacheKey, resultStats);
        }
        hasNonZeroResult.set(
          results.some(
            (result) => StatPromise.fullfiled(result) && `${countResult([result.value])}` !== '0',
          ),
        );
        countsLoading.set(false);
      },
    );
    const totalCount = resultStats.find((count) => count.key === branding?.results?.totalStatKey);
    if (totalCount) {
      Promise.allSettled(StatPromise.list(totalCount).map(({ promise }) => promise)).then(
        (results: PromiseSettledResult<StatValue>[]) => {
          const values = results.filter(StatPromise.fullfiled).map(({ value }) => value);
          totalParticipants.set(countResult(values, false) as number);
        },
      );
    }
  } catch (error) {
    console.error(error);
    countsLoading.set(false);
    if (!isToastShowing('query-error')) {
      toaster.error({
        id: 'query-error',
        duration: 4000,
        title:
          'An error occured while loading patient counts. If this problem persists, please contact an administrator.',
        closable: true,
      });
    }
  }
}

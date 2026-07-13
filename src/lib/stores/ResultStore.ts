import { get, writable, type Writable } from 'svelte/store';

import { isToastShowing, toaster } from '$lib/toaster';
import { config } from '$lib/configuration.svelte';
import { getResultList, StatPromise } from '$lib/utilities/StatBuilder';
import { countResult } from '$lib/utilities/PatientCount';
import { log, createLog } from '$lib/logger';

import type { PatientCount, StatResult } from '$lib/models/Stat';
import type { Filter } from '$lib/models/Filter.svelte';
import { filters, genomicFilters } from '$lib/stores/Filter';
import { objectUUID } from '$lib/utilities/UUID';
import { searchTerm, selectedFacets } from '$lib/stores/Search';
import { loading as resourcesPromise, loadResources } from '$lib/stores/Resources';

const CACHE_MAX_ENTRIES = 100;
const requestCache: Map<string, StatResult[]> = new Map();
export const hasNonZeroResult: Writable<boolean> = writable(false);
export const resultCounts: Writable<StatResult[]> = writable([]);
export const loading: Writable<Promise<void>> = writable(Promise.resolve());
export const countsLoading: Writable<boolean> = writable(false);
export const totalParticipants: Writable<PatientCount> = writable(0);

async function updateDerivedCountStores(resultStats: StatResult[]) {
  const results = await Promise.allSettled(
    resultStats.flatMap(StatPromise.list).map(({ promise }) => promise),
  );

  hasNonZeroResult.set(
    results.some(
      (result) => StatPromise.fullfiled(result) && `${countResult([result.value])}` !== '0',
    ),
  );

  const totalCount = resultStats.find(
    (count) => count.key === config.branding.results.totalStatKey,
  );
  if (totalCount) {
    const totalResults = await Promise.allSettled(
      StatPromise.list(totalCount).map(({ promise }) => promise),
    );
    const values = totalResults.filter(StatPromise.fullfiled).map(({ value }) => value);
    const count = countResult(values, false);
    totalParticipants.set(count);
    log(createLog('QUERY', 'query.count_returned', { count }));
  }

  return results;
}

export async function loadPatientCount(useAuth: boolean) {
  const isOpenAccess = !useAuth && !config.features.explorer.open && config.features.discover;
  loadResources();
  try {
    if (requestCache.size >= CACHE_MAX_ENTRIES) {
      requestCache.clear();
    }

    const hashFilter = (f: Filter, operator?: string) =>
      objectUUID({ ...f, parent: undefined, uuid: undefined, operator });
    const cacheKey = JSON.stringify([
      isOpenAccess,
      get(searchTerm),
      get(selectedFacets).map((facet) => facet.name),
      get(genomicFilters).map((f) => hashFilter(f)),
      // if operator changes we need to redo query
      get(filters).map((f) => hashFilter(f, f.parent?.operator)),
    ]);
    if (requestCache.has(cacheKey)) {
      const cachedResults = requestCache.get(cacheKey) as StatResult[];
      resultCounts.set(cachedResults);
      await updateDerivedCountStores(cachedResults);
      countsLoading.set(false);
      return;
    }

    await get(resourcesPromise);
    const resultStats: StatResult[] = getResultList(
      isOpenAccess,
      config.branding.results.stats || [],
    );
    resultCounts.set(resultStats);
    countsLoading.set(true);
    log(createLog('QUERY', 'query.start_load_patient_count'));
    updateDerivedCountStores(resultStats)
      .then((results) => {
        if (!results.some(StatPromise.rejected)) {
          // Cache if no rejected requests
          requestCache.set(cacheKey, resultStats);
        }
        countsLoading.set(false);
      })
      .catch((error) => {
        console.error(error);
        countsLoading.set(false);
      });
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

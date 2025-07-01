import { get, writable, type Writable } from 'svelte/store';

import type { Stat } from '$lib/types';
import { toaster } from '$lib/toaster';
import { branding } from '$lib/configuration';
import { filters } from '$lib/stores/Filter';
import { getResultList, promiseList } from '$lib/utilities/StatBuilder';
import { countResult } from '$lib/utilities/PatientCount';
import { loadResources } from '$lib/stores/Resources';

export const hasNonZeroResult: Writable<boolean> = writable(false);
export const resultCounts: Writable<Stat[]> = writable([]);
export const loading: Writable<Promise<void>> = writable(Promise.resolve());
export const totalParticipants: Writable<number> = writable(0);

export async function loadPatientCount(isOpenAccess: boolean) {
  await loadResources();
  const resultStats: Stat[] = getResultList(isOpenAccess, branding?.results?.stats || []);
  resultCounts.set(resultStats);
  loading.set(
    Promise.allSettled(resultStats.flatMap(promiseList)).then((results) => {
      if (results.some((result) => result.status === 'rejected')) {
        if (get(filters).length !== 0) {
          toaster.error({ description: branding?.explorePage?.filterErrorText, closable: false });
        } else {
          toaster.error({ title: branding?.explorePage?.queryErrorText });
        }
      }
      loading.set(Promise.resolve());
      hasNonZeroResult.set(
        results.some((result) => result.status === 'fulfilled' && result.value !== 0),
      );
    }),
  );
  const totalCount = resultStats.find(
    (count) => count.key === branding?.results?.participantsStatKey,
  );
  if (totalCount) {
    Promise.allSettled(promiseList(totalCount)).then((results) => {
      const values = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      totalParticipants.set(countResult(values, false) as number);
    });
  }
}

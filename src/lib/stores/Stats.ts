import { derived, writable, type Readable, type Writable } from 'svelte/store';

import type { Stat } from '$lib/types';
import { branding } from '$lib/configuration';
import { getStatList, promiseList } from '$lib/utilities/StatBuilder';
import { loadResources } from '$lib/stores/Resources';

export const hasError: Writable<boolean> = writable(false);
export const loaded: Writable<boolean> = writable(false);
const statData: Writable<Stat[]> = writable([]);
export const stats: Readable<Stat[]> = derived(statData, ($s) => $s.filter((stat) => !stat.auth));
export const authStats: Readable<Stat[]> = derived(statData, ($s) =>
  $s.filter((stat) => stat.auth),
);

export async function loadLandingStats() {
  await loadResources();
  loaded.set(false);
  hasError.set(false);
  const stats: Stat[] = getStatList(branding?.landing?.stats || []);
  statData.set(stats);
  Promise.allSettled(stats.flatMap(promiseList)).then((results) => {
    if (results.some((result) => result.status === 'rejected')) {
      hasError.set(true);
    }
    loaded.set(true);
  });
}

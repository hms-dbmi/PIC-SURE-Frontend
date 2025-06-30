import { get, derived, writable, type Readable, type Writable } from 'svelte/store';

import { toaster } from '$lib/toaster';
import { branding } from '$lib/configuration';
import { getStatList, StatPromise } from '$lib/utilities/StatBuilder';

import type { StatResult } from '$lib/models/Stat';
import { loading as resourcesPromise } from '$lib/stores/Resources';

export const hasError: Writable<boolean> = writable(false);
export const loaded: Writable<boolean> = writable(false);
const statData: Writable<StatResult[]> = writable([]);
export const stats: Readable<StatResult[]> = derived(statData, ($s) =>
  $s.filter((stat) => !stat.auth),
);
export const authStats: Readable<StatResult[]> = derived(statData, ($s) =>
  $s.filter((stat) => stat.auth),
);

export async function loadLandingStats() {
  try {
    if (get(statData).length > 0) {
      return;
    }

    await get(resourcesPromise);
    loaded.set(false);
    hasError.set(false);
    const stats: StatResult[] = getStatList(branding?.landing?.stats || []);
    statData.set(stats);
    Promise.allSettled(stats.flatMap(StatPromise.list)).then((results) => {
      if (results.some(StatPromise.rejected)) {
        hasError.set(true);
      }
      loaded.set(true);
    });
  } catch (error) {
    console.error(error);
    toaster.error({
      title:
        'An error occured while loading statistics. If this problem persists, please contact an administrator.',
    });
  }
}

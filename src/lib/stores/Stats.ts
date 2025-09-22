import { get, derived, writable, type Readable, type Writable } from 'svelte/store';

import { isToastShowing, toaster } from '$lib/toaster';
import { branding } from '$lib/configuration';
import { getValidStatList, populateStatRequests, StatPromise } from '$lib/utilities/StatBuilder';

import type { StatResult } from '$lib/models/Stat';
import { loading as resourcesPromise, loadResources } from '$lib/stores/Resources';

export const hasError: Writable<boolean> = writable(false);
export const loaded: Writable<boolean> = writable(false);
const statData: Writable<StatResult[]> = writable([]);
export const stats: Readable<StatResult[]> = derived(statData, ($s) =>
  $s.filter((stat) => !stat.auth),
);
export const authStats: Readable<StatResult[]> = derived(statData, ($s) =>
  $s.filter((stat) => stat.auth),
);
let lastStatRequest: string = '';

export async function loadLandingStats() {
  loadResources();
  try {
    const validStats = getValidStatList(branding?.landing?.stats || []);

    // Rudmientary caching for when a user loads the page in open mode and then authenticates.
    // Stat list will be different for open and auth - see getValidStatList method.
    const thisStatRequest = validStats.map(({ auth, key }) => [auth, key].join(',')).join(';');
    if (lastStatRequest === thisStatRequest) {
      return;
    }
    lastStatRequest = thisStatRequest;

    await get(resourcesPromise);
    loaded.set(false);
    hasError.set(false);
    const stats: StatResult[] = populateStatRequests(validStats);
    statData.set(stats);
    Promise.allSettled(stats.flatMap(StatPromise.list).map(({ promise }) => promise)).then((results) => {
      if (results.some(StatPromise.rejected)) {
        hasError.set(true);
      }
      loaded.set(true);
    });
  } catch (error) {
    console.error(error);
    if (!isToastShowing('stats-error')) {
      toaster.error({
        id: 'stats-error',
        title:
          'An error occured while loading statistics. If this problem persists, please contact an administrator.',
        closable: true,
      });
    }
  }
}

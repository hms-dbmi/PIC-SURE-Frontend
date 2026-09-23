import { config } from '$lib/configuration.svelte';
import type { StatResult } from '$lib/models/Stat';
import { getValidStatList, populateStatRequests, StatPromise } from '$lib/utilities/StatBuilder';
import { access, ensureAccess } from './access.svelte';
import { session } from './session.svelte';

let data = $state.raw<StatResult[]>([]);
let loaded = $state(false);
let hasError = $state(false);
let owner = $state('');
let completedKey = '';
let pending: { key: string; promise: Promise<void> } | undefined;
let requestId = 0;

const accessKey = () => `${session.revision}:${access.revision}`;

export const landingStats = {
  get stats() {
    return owner === accessKey() ? data.filter((stat) => !stat.auth) : [];
  },
  get authStats() {
    return owner === accessKey() ? data.filter((stat) => stat.auth) : [];
  },
  get loaded() {
    return owner === accessKey() && loaded;
  },
  get hasError() {
    return owner === accessKey() && hasError;
  },
};

export function loadLandingStats(): Promise<void> {
  const validStats = getValidStatList(config.branding.landing.stats || []);
  const version = accessKey();
  const key = `${version}:${JSON.stringify(validStats)}`;
  if (pending?.key === key) return pending.promise;
  if (completedKey === key) return Promise.resolve();

  const id = ++requestId;
  owner = version;
  loaded = false;
  hasError = false;
  const current = () => id === requestId && version === accessKey();
  const promise = Promise.resolve().then(async () => {
    try {
      if (!current()) return;
      const results = populateStatRequests(validStats);
      data = results;
      const settled = await Promise.allSettled(
        results.flatMap(StatPromise.list).map(({ promise }) => promise),
      );
      if (!current()) return;
      hasError = settled.some(StatPromise.rejected);
      completedKey = hasError ? '' : key;
    } catch (error) {
      if (!current()) return;
      console.error(error);
      hasError = true;
      completedKey = '';
    } finally {
      if (current()) loaded = true;
      if (pending?.promise === promise) pending = undefined;
    }
  });
  pending = { key, promise };
  return promise;
}

export async function retryLandingStats() {
  await ensureAccess({ retry: true }).catch(() => {});
  return loadLandingStats();
}

import { get, derived, writable, type Writable } from 'svelte/store';
import { type Application } from '#lib/admin/access/model/applications.ts';

import * as access from '#lib/api/psama/access.ts';

const loaded = writable(false);
export const applications: Writable<Application[]> = writable([]);
export const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]), []);

export async function loadApplications() {
  if (get(loaded)) return;

  applications.set(await access.applications.list());
  loaded.set(true);
}

export function getApplication(uuid: string) {
  const store: Application[] = get(applications);
  return store.find((a) => a.uuid === uuid);
}

export default {
  subscribe: applications.subscribe,
  applications,
  applicationList,
  loadApplications,
  getApplication,
};

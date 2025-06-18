import { get, derived, writable, type Writable } from 'svelte/store';
import { type Application } from '$lib/models/Applications';

import * as api from '$lib/api';
import { Psama } from '$lib/paths';

const loaded = writable(false);
export const applications: Writable<Application[]> = writable([]);
export const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]), []);

export async function loadApplications() {
  if (get(loaded)) return;

  const res = await api.get(Psama.Application);
  applications.set(res);
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

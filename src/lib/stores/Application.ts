import { get, derived, writable, type Writable } from 'svelte/store';
import { type Application } from '$lib/models/Applications';

import * as api from '$lib/api';

const APP_URL = 'psama/application';

const loaded = writable(false);
const applications: Writable<Application[]> = writable([]);
const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]));

async function loadApplications() {
  if (get(loaded)) return;

  const res = await api.get(APP_URL);
  applications.set(res);
  loaded.set(true);
}

function getApplication(uuid: string) {
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

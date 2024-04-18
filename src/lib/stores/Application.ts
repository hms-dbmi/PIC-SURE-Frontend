import { get, derived, writable, type Writable } from 'svelte/store';
import { type Application } from '$lib/models/Applications';

import { applications as mockApps } from './mock/data';

/* eslint-disable @typescript-eslint/no-unused-vars */
const APP_URL = 'psama/application';
/* eslint-enable @typescript-eslint/no-unused-vars */

const applications: Writable<Application[]> = writable([]);
const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]));

// TODO: Add api integration
async function loadApplications() {
  applications.set(mockApps);
}

function getApplication(uuid: string) {
  const store: Application[] = get(applications);
  const appIndex: number = store.findIndex((a) => a.uuid === uuid);
  return store[appIndex];
}

export default {
  subscribe: applications.subscribe,
  applications,
  applicationList,
  loadApplications,
  getApplication,
};

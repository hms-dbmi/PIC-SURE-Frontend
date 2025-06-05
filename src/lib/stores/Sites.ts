import { writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';

const RESOURCE_URL = '/picsure/passthru/sites';

interface Site {
  name: string,
  resourceUUID: string,
  online: boolean,
}

export const sites: Writable<Site[]> = writable([]);

export async function loadResources() {
  const result: Site[] = await api.get(RESOURCE_URL);
  sites.set(result);
};
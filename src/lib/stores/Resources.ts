import { writable, type Writable } from 'svelte/store';

import { useOpenAccess } from '$lib/AccessState';

interface QueryResource {
  name: string;
  uuid: string;
}

// The single-resource HPDS UUID fork (hpdsAuth/hpdsOpen/hpdsOpenV3/search/visualization/aggregate and
// their VITE_RESOURCE_* reads) is REMOVED: with path-based gateway routing (spec §3.3), the backend is
// selected by URL path (`/hpds/auth` vs `/hpds/open`), not by a resource UUID. The PSAMA `application`
// id remains because it is used for the query template.
export interface ResourceMap {
  application: string;
}

const defaultResources: ResourceMap = {
  application: (import.meta.env?.VITE_RESOURCE_APP || '') as string,
};

export const resources: Writable<ResourceMap> = writable(defaultResources);

export function getCountResource(isOpenAccess: boolean = false): QueryResource {
  return { name: useOpenAccess(isOpenAccess) ? 'hpdsOpen' : 'hpds', uuid: '' };
}

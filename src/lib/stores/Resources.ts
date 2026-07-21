import { get, writable, type Writable } from 'svelte/store';

import { useOpenAccess } from '$lib/AccessState';

interface QueryResource {
  name: string;
  uuid: string;
}

export interface ResourceMap {
  visualization: string;
  application: string;
  aggregate: string;
  search: string;
  hpdsOpen: string;
  hpdsOpenV3: string;
  hpdsAuth: string;
}

const defaultResources: ResourceMap = {
  visualization: (import.meta.env?.VITE_RESOURCE_VIZ || '') as string,
  application: (import.meta.env?.VITE_RESOURCE_APP || '') as string,
  aggregate: (import.meta.env?.VITE_RESOURCE_AGGREGATE || '') as string,
  search: (import.meta.env?.VITE_RESOURCE_SEARCH ||
    import.meta.env?.VITE_RESOURCE_HPDS ||
    '') as string,
  hpdsOpen: (import.meta.env?.VITE_RESOURCE_OPEN_HPDS || '') as string,
  hpdsAuth: (import.meta.env?.VITE_RESOURCE_HPDS || '') as string,
  hpdsOpenV3: (import.meta.env?.VITE_RESOURCE_OPEN_V3_HPDS || '') as string,
};

export const resources: Writable<ResourceMap> = writable(defaultResources);

export function getCountResource(isOpenAccess: boolean = false): QueryResource {
  const resourceMap = get(resources);
  return useOpenAccess(isOpenAccess)
    ? { name: 'hpdsOpen', uuid: resourceMap.hpdsOpenV3 }
    : { name: 'hpds', uuid: resourceMap.hpdsAuth };
}

import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { config } from '$lib/configuration.svelte';
import { toaster } from '$lib/toaster';

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
  queryIdGen: string;
  queryable: QueryResource[];
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
  queryIdGen: (import.meta.env?.VITE_RESOURCE_QUERY_ID_GEN || '') as string,
  queryable: [],
};

interface ResourceResponse {
  uuid: string;
  name: string;
  description: string;
  targetURL: string;
  resourceRSPath: string;
  hidden: boolean;
  metadata: string;
}

export const loading: Writable<Promise<void>> = writable(Promise.resolve());
export const resources: Writable<ResourceMap> = writable(defaultResources);

export function getQueryResources(isOpenAccess: boolean = false): QueryResource[] {
  const _resources = get(resources);
  return config.features.federated
    ? _resources.queryable
    : [
        isOpenAccess
          ? { name: 'hpdsOpen', uuid: _resources.hpdsOpen }
          : { name: 'hpds', uuid: _resources.hpdsAuth },
      ];
}

async function getResources() {
  if (get(resources).queryable.length > 0) return;

  const resourceMap: ResourceMap = defaultResources;
  if (config.features.federated) {
    await api
      .get(Picsure.Resources)
      .then((siteResources: ResourceResponse[]) => {
        resourceMap.queryable = siteResources
          .filter(({ hidden, resourceRSPath }) => !hidden && resourceRSPath.includes('passthru'))
          .map(({ name, uuid }) => ({ name, uuid }));
      })
      .catch(() => toaster.error({ description: 'Failed to load remote resource list.' }));
  }
  resources.set(resourceMap);
  console.debug('Resources', resourceMap);
}

export async function loadResources() {
  loading.set(getResources());
}

import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { features } from '$lib/configuration';
import { toaster } from '$lib/toaster';

interface QueryResource {
  name: string;
  uuid: string;
}

export interface ResourceMap {
  visualization: string;
  application: string;
  aggregate: string;
  hpdsOpen: string;
  hpdsAuth: string;
  query: QueryResource[];
}

const defaultResources: ResourceMap = {
  visualization: (import.meta.env?.VITE_RESOURCE_VIZ || '') as string,
  application: (import.meta.env?.VITE_RESOURCE_APP || '') as string,
  aggregate: (import.meta.env?.VITE_RESOURCE_AGGREGATE || '') as string,
  hpdsOpen: (import.meta.env?.VITE_RESOURCE_OPEN_HPDS || '') as string,
  hpdsAuth: (import.meta.env?.VITE_RESOURCE_HPDS || '') as string,
  query: [],
};

export const resources: Writable<ResourceMap> = writable(defaultResources);

interface ResourceResponse {
  uuid: string;
  name: string;
  description: string;
  targetURL: string;
  resourceRSPath: string;
  hidden: boolean;
  metadata: string;
}

export async function loadResources() {
  if (get(resources).query.length > 0) return;

  const resourceMap: ResourceMap = defaultResources;
  if (features.federated) {
    await api
      .get(Picsure.Resources)
      .then((siteResources: ResourceResponse[]) => {
        resourceMap.query = siteResources
          .filter(({ resourceRSPath }) => resourceRSPath.includes('passthru'))
          .map(({ name, uuid }) => ({ name, uuid }));
      })
      .catch(() => toaster.error({ description: 'Failed to load remote resource list.' }));
  }
  resources.set(resourceMap);
  console.debug('Resources', resourceMap);
}

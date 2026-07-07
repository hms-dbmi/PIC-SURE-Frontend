import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { features } from '$lib/configuration';
import { toaster } from '$lib/toaster';
import { useOpenAccess } from '$lib/AccessState';

interface QueryResource {
  name: string;
  uuid: string;
}

// The single-resource HPDS UUID fork (hpdsAuth/hpdsOpen/hpdsOpenV3/search/visualization/aggregate and
// their VITE_RESOURCE_* reads) is REMOVED: with path-based gateway routing, the backend is
// selected by URL path (`/hpds/auth` vs `/hpds/open`), not by a resource UUID. What remains is the
// federated site registry (`queryable`, discovered via getResources) plus the PSAMA `application` id
// used for the query template. Federated discovery has no path-based replacement yet and is being
// removed from the UI separately — see the PR's open questions.
export interface ResourceMap {
  application: string;
  queryIdGen: string;
  queryable: QueryResource[];
}

const defaultResources: ResourceMap = {
  application: (import.meta.env?.VITE_RESOURCE_APP || '') as string,
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
  // Non-federated: a single logical resource. The `uuid` is now vestigial — the query path selects the
  // open/auth HPDS backend — so it is left empty; `name` still keys the per-resource stat/result maps.
  return features.federated
    ? _resources.queryable
    : [{ name: useOpenAccess(isOpenAccess) ? 'hpdsOpen' : 'hpds', uuid: '' }];
}

async function getResources() {
  if (get(resources).queryable.length > 0) return;

  const resourceMap: ResourceMap = defaultResources;
  if (features.federated) {
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

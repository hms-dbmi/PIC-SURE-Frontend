import { writable, type Writable } from 'svelte/store';

import { isExploreWithoutLogin, useOpenAccess } from '$lib/AccessState';

interface QueryResource {
  name: string;
  uuid: string;
}

// The single-resource HPDS UUID fork (hpdsAuth/hpdsOpen/hpdsOpenV3/search/visualization/aggregate and
// their VITE_RESOURCE_* reads) is REMOVED: with path-based gateway routing, the backend is
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

export interface ApiConnectionResource extends QueryResource {
  requiresAuth: boolean;
  usesDistinctOpenResource: boolean;
}

export function getApiConnectionResource(authenticated: boolean): ApiConnectionResource {
  const authorizedResource = getCountResource(false);

  if (authenticated) {
    return {
      ...authorizedResource,
      requiresAuth: true,
      usesDistinctOpenResource: false,
    };
  }

  // Explore-without-login deployments serve anonymous traffic from the authorized
  // backend, so there is no distinct open resource for the examples to point at.
  if (isExploreWithoutLogin()) {
    return {
      ...authorizedResource,
      requiresAuth: false,
      usesDistinctOpenResource: false,
    };
  }

  // Everywhere else the gateway always exposes an open backend at `/hpds/open`, so
  // anonymous examples connect to it without a token.
  return {
    ...getCountResource(true),
    requiresAuth: false,
    usesDistinctOpenResource: true,
  };
}

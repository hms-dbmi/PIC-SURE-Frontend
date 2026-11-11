import { isExploreWithoutLogin, useOpenAccess } from '#lib/explorer/mode.ts';

interface QueryResource {
  name: string;
}

export function getCountResource(isOpenAccess: boolean = false): QueryResource {
  return { name: useOpenAccess(isOpenAccess) ? 'hpdsOpen' : 'hpds' };
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

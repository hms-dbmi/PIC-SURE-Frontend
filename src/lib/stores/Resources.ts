import { useOpenAccess } from '$lib/AccessState';

interface QueryResource {
  name: string;
  uuid: string;
}

// The single-resource HPDS UUID fork (hpdsAuth/hpdsOpen/hpdsOpenV3/search/visualization/aggregate and
// their VITE_RESOURCE_* reads) is REMOVED: with path-based gateway routing, the backend is
// selected by URL path (`/hpds/auth` vs `/hpds/open`), not by a resource UUID.
//
// Nothing is left to store. The federated site registry went with federation itself (ALS-11901), and
// the PSAMA `application` id went with the query template: it existed only to address
// `/user/me/queryTemplate/{applicationId}`, and `/user/me/consents` is self-scoped. What remains is a
// pure function — the `uuid` is vestigial and always empty; `name` still keys the per-resource
// stat/result maps.
export function getCountResource(isOpenAccess: boolean = false): QueryResource {
  return { name: useOpenAccess(isOpenAccess) ? 'hpdsOpen' : 'hpds', uuid: '' };
}

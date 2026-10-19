import { redirect, type LoadEvent } from '@sveltejs/kit';
import { browser } from '$app/env';
import type { AccessReason } from '#lib/auth/accessReason.ts';
import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
import { BDCPrivileges, PicsurePrivileges } from '#lib/auth/model/privilege.ts';
import type { Route } from '#lib/auth/model/route.ts';
import { isTopAdmin, type User } from '#lib/auth/model/user.ts';
import { routes } from '#lib/auth/nav.ts';
import { session } from '#lib/auth/session.svelte.ts';
import { getTokenExpiration } from '#lib/auth/token.ts';
import { config } from '#lib/config/config.svelte.ts';
import type { Features } from '#lib/config/index.ts';

/** Who may open a route. Privilege lists name both deployments' privileges (PIC-SURE and BDC). */
export interface Access {
  /** The policy of the layout this route is nested in. It is checked first. */
  within?: Access;
  /** Whether the visitor must be signed in with an unexpired token. */
  login?: boolean | ((features: Features) => boolean);
  /** The reason given to a visitor who isn't signed in. An expired token always gives `expired`. */
  signedOutReason?: AccessReason;
  /** A signed-in visitor needs one of these. */
  anyOf?: readonly string[];
  topAdmin?: boolean;
  feature?: (features: Features) => boolean;
  /** Where a visitor who fails `anyOf`, `topAdmin` or `feature` goes. */
  otherwise?: '/' | '/explorer' | '/admin/configuration';
  /** The reason given with `otherwise`. */
  deniedReason?: AccessReason;
}

const authorized: Access = {
  login: true,
  signedOutReason: 'no_token',
  anyOf: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
  deniedReason: 'no_privilege',
};

// Admin pages are nested in the authorized ones, so an admin also needs query access (D3).
const admin: Access = {
  within: authorized,
  anyOf: [PicsurePrivileges.ADMIN, PicsurePrivileges.SUPER],
};

export const ACCESS = {
  /** Every page except the login pages: a closed deployment requires signing in. */
  app: { login: (features) => !features.login.open },
  authorized,
  admin,
  // Roles, privileges and connections: PSAMA rejects a plain admin's writes to them.
  topAdmin: { within: admin, topAdmin: true, otherwise: '/admin/configuration' },
  dataset: {
    within: authorized,
    anyOf: [PicsurePrivileges.NAMED_DATASET, BDCPrivileges.NAMED_DATASET],
  },
  explorer: { login: (features) => !features.explorer.open, signedOutReason: 'explore' },
  discover: { feature: (features) => features.discover, otherwise: '/explorer' },
  api: { feature: (features) => features.analyzeApi },
  dashboard: { feature: (features) => features.dashboard },
} satisfies Record<string, Access>;

/** What a guard knows about the visitor: the session's token and profile. */
export interface Visitor {
  token: string;
  user: User;
  /** The session bootstrap couldn't load the profile for this token. */
  profileFailed: boolean;
}

/** Whether `policy` requires signing in on this deployment. */
export function requiresLogin(policy: Access, features: Features): boolean {
  const login = typeof policy.login === 'function' ? policy.login(features) : policy.login;
  return !!login || (!!policy.within && requiresLogin(policy.within, features));
}

function checksProfile(policy: Access): boolean {
  return !!policy.anyOf || !!policy.topAdmin || (!!policy.within && checksProfile(policy.within));
}

// Not isTokenExpired, which logs a token it can't read.
function hasExpired(token: string): boolean {
  try {
    return getTokenExpiration(token) < Date.now();
  } catch {
    return true;
  }
}

function deniedPath(policy: Access, url: URL): string {
  const to = policy.otherwise ?? '/';
  if (!policy.deniedReason) return to;
  const from = encodeURIComponent(url.pathname + url.search);
  return `${to}?reason=${policy.deniedReason}&from=${from}`;
}

/**
 * Where `policy` sends a visitor who asked for `url`, or `undefined` to let them in. On the server
 * there is no session (`visitor` is undefined), so only the feature flags are checked there.
 */
export function accessRedirect(
  policy: Access,
  url: URL,
  features: Features,
  visitor?: Visitor,
): string | undefined {
  const outer = policy.within && accessRedirect(policy.within, url, features, visitor);
  if (outer) return outer;
  if (policy.feature && !policy.feature(features)) return policy.otherwise ?? '/';
  if (!visitor) return undefined;

  const login = typeof policy.login === 'function' ? policy.login(features) : policy.login;
  if (login && !visitor.token) return loginRedirectPath(url, policy.signedOutReason);
  if (login && hasExpired(visitor.token)) return loginRedirectPath(url, 'expired');

  if (!policy.anyOf && !policy.topAdmin) return undefined;
  // PSAMA refuses a user who hasn't accepted the terms everything until they do, and the terms
  // dialog holds them where they are.
  if (visitor.user.acceptedTOS === false) return undefined;
  if (visitor.profileFailed) return loginRedirectPath(url, 'hydrate_failed');
  const privileges = visitor.user.privileges ?? [];
  const allowed =
    (!policy.anyOf || policy.anyOf.some((privilege) => privileges.includes(privilege))) &&
    (!policy.topAdmin || isTopAdmin(visitor.user));
  return allowed ? undefined : deniedPath(policy, url);
}

/**
 * A route's guard: waits for the layouts above it and, when `policy` checks privileges, for the
 * session bootstrap, then redirects unless `policy` lets the visitor in. It only reads: the page
 * it redirects to acts on the reason in the URL (see `handleAccessReason`).
 */
export async function requireAccess(
  { url, parent }: Pick<LoadEvent, 'url' | 'parent'>,
  policy: Access,
): Promise<void> {
  // The root layout applies the config, and outer layouts run their guards first.
  await parent();
  if (browser && checksProfile(policy)) await session.bootstrap();
  const visitor = browser
    ? { token: session.token, user: session.user, profileFailed: session.profileFailed }
    : undefined;
  const to = accessRedirect(policy, url, config.features, visitor);
  if (to) redirect(302, to);
}

/** The nav routes `user` may open. Pass `undefined` for a signed-out visitor. */
export function routesFor(user: User | undefined, features: Features): Route[] {
  const privileges: string[] = user?.privileges ?? [];

  function featureRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) => (route.feature ? features[route.feature] : true))
      .map((route) =>
        route.children ? { ...route, children: featureRoutes(route.children) } : route,
      );
  }

  if (privileges.length === 0) {
    const openRoutes = featureRoutes(routes.filter((route) => !route.privilege));
    if (!user && features.login.open && !features.discover) {
      openRoutes.unshift({ path: '/explorer', text: 'Explore' });
    }
    return openRoutes;
  }

  const featured = featureRoutes(routes);
  if (privileges.includes(PicsurePrivileges.SUPER)) return featured;

  function allowedRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) => !route.privilege || route.privilege.some((p) => privileges.includes(p)))
      .map((route) =>
        route.children ? { ...route, children: allowedRoutes(route.children) } : route,
      );
  }
  return allowedRoutes(featured);
}

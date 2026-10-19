import type { AccessReason } from '#lib/auth/accessReason.ts';
import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
import { BDCPrivileges, PicsurePrivileges } from '#lib/auth/model/privilege.ts';
import { isTopAdmin, type User } from '#lib/auth/model/user.ts';
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
  anyOf?: readonly (PicsurePrivileges | BDCPrivileges)[];
  topAdmin?: boolean;
  feature?: (features: Features) => boolean;
  /** Where a visitor who fails `anyOf`, `topAdmin` or `feature` goes. */
  otherwise?: '/' | '/explorer' | '/admin/configuration';
  /** The reason given to a signed-in visitor who fails `anyOf` or `topAdmin`. */
  deniedReason?: AccessReason;
}

const authorized = {
  login: true,
  signedOutReason: 'no_token',
  anyOf: [PicsurePrivileges.QUERY, BDCPrivileges.AUTHORIZED_ACCESS],
  deniedReason: 'no_privilege',
} satisfies Access;

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

export interface Visitor {
  signedIn: boolean;
  /** Signed in with a token that hasn't expired yet. */
  tokenValid: boolean;
  user: User;
  /** The session bootstrap couldn't load the profile for this token. */
  profileFailed: boolean;
}

function ownLogin(policy: Access, features: Features): boolean {
  return typeof policy.login === 'function' ? policy.login(features) : !!policy.login;
}

/** Whether `policy`, or one it is nested in, requires signing in on this deployment. */
export function requiresLogin(policy: Access, features: Features): boolean {
  return ownLogin(policy, features) || (!!policy.within && requiresLogin(policy.within, features));
}

function holdsPrivileges(policy: Access, user: User): boolean {
  const privileges = user.privileges ?? [];
  return (
    (!policy.anyOf || policy.anyOf.some((privilege) => privileges.includes(privilege))) &&
    (!policy.topAdmin || isTopAdmin(user))
  );
}

/**
 * Whether `policy` lets in a visitor with this profile (`undefined` when signed out). The nav and
 * footer show a link only to these visitors. Token expiry and the terms aren't checked: the guard
 * deals with those when the visitor arrives.
 */
export function admits(policy: Access, features: Features, user: User | undefined): boolean {
  if (policy.within && !admits(policy.within, features, user)) return false;
  if (policy.feature && !policy.feature(features)) return false;
  if (!user && ownLogin(policy, features)) return false;
  return holdsPrivileges(policy, user ?? {});
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

  if (ownLogin(policy, features)) {
    if (!visitor.signedIn) return loginRedirectPath(url, policy.signedOutReason);
    if (!visitor.tokenValid) return loginRedirectPath(url, 'expired');
  }

  if (!policy.anyOf && !policy.topAdmin) return undefined;
  // Until a user accepts the terms, PSAMA refuses all their requests and the terms dialog holds
  // them on the page they asked for. Accepting runs the guards again.
  if (visitor.user.acceptedTOS === false) return undefined;
  if (visitor.profileFailed) return loginRedirectPath(url, 'hydrate_failed');
  return holdsPrivileges(policy, visitor.user) ? undefined : deniedPath(policy, url);
}

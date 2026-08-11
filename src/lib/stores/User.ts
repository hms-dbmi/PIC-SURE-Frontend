import { resolve } from '$app/paths';
import { get, writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import * as api from '$lib/api';
import type { Route } from '$lib/models/Route';
import type { ConsentsMap, User } from '$lib/models/User';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { routes, config } from '$lib/configuration.svelte';
import { Psama } from '$lib/paths';
import { goto } from '$app/navigation';
import type AuthProvider from '$lib/models/AuthProvider.ts';
import { page } from '$app/state';
import { log, createLog } from '$lib/logger';
import { isToastShowing, toaster } from '$lib/toaster';

// Create a store that syncs with localStorage
function createLocalStorageStore(key: string, initialValue: boolean) {
  const store = writable(browser ? !!localStorage.getItem(key) : initialValue);

  if (browser) {
    // Update store when localStorage changes in other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === key) {
        store.set(!!event.newValue);
      }
    });
  }

  return store;
}

// Initialize tokenStatus first, before any other operations
export const tokenStatus: Writable<boolean> = createLocalStorageStore('token', false);
export const user: Writable<User> = writable(restoreUser());
export const isTopAdmin = derived(user, ($user: User) => {
  return $user?.privileges?.includes(PicsurePrivileges.SUPER);
});
export const isAdmin = derived(user, ($user: User) => {
  return $user?.privileges?.includes(PicsurePrivileges.ADMIN);
});

/**
 * `\_consents\` is the complete grant list; the harmonized and topmed keys are subsets the
 * backend uses to authorize queries. Token-gated, so a logout in another tab cannot leave a
 * restored sessionStorage blob reporting access the user no longer has.
 */
export const consentedStudies: Readable<string[]> = derived(
  [user, tokenStatus],
  ([$user, $hasToken]: [User, boolean]) =>
    $hasToken ? ($user?.consents?.['\\_consents\\'] ?? []) : [],
);

/**
 * Unknown access, not absent access: `{}` is loaded-with-none, missing is unknown.
 * Derived from the data because `user` persists to sessionStorage and module state does not -
 * a reload skips re-hydrating, so a status flag would reset to "fine" and fail open again.
 */
export const accessUnavailable: Readable<boolean> = derived(
  [user, tokenStatus],
  ([$user, $hasToken]: [User, boolean]) => $hasToken && $user?.consents === undefined,
);

// User data lives in sessionStorage (tab-scoped), not localStorage. Each tab has its own
// isolated user state, so opening the app in multiple tabs or logging out in one tab
// cannot leak stale admin/privileged data into another tab's UI. Token stays in
// localStorage because the API client reads it on every request and a fresh tab needs
// to know the user is already authenticated.
user.subscribe(($user: User) => {
  if (browser) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _, ...userWithoutToken } = $user;
    sessionStorage.setItem('user', JSON.stringify(userWithoutToken));
  }
});

export function setToken(token: string) {
  localStorage.setItem('token', token);
  tokenStatus.set(true);
}

export function getToken(): string {
  return localStorage.getItem('token') || '';
}

export function removeToken() {
  localStorage.removeItem('token');
  tokenStatus.set(false);
}

/**
 * Clear all client-side session state: token, persisted user blob, and the user store.
 *
 * DO NOT call this from module-init code paths (e.g. `restoreUser`). The `user` store
 * does not exist yet at that point, so `user.set()` will throw. `restoreUser` instead
 * clears localStorage inline and returns `{}` as the initial store value.
 */
export function clearSession() {
  removeToken();
  sessionStorage.removeItem('user');
  user.set({});
}

function restoreUser() {
  if (!browser) return {};

  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    console.log('Clearing expired token from storage.');
    removeToken();
    sessionStorage.removeItem('user');
    log(createLog('AUTH', 'session.expired'));
    return {};
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!stored || Object.keys(stored).length === 0) return {};
    console.log('Restored user from session storage: ', stored);
    return stored;
  } catch (error) {
    console.error('Error reading user from session storage: ' + error);
    return {};
  }
}

export function isUserLoggedIn() {
  if (browser) {
    return !!localStorage.getItem('token');
  }
  return false;
}

export const userRoutes: Readable<Route[]> = derived([user], ([$user]) => {
  const userPrivileges: string[] = $user?.privileges || [];

  if (userPrivileges.length === 0 || !isUserLoggedIn()) {
    // Public routes for non-logged in user
    const openRoutes = featureRoutes(routes.filter((route) => !route.privilege));
    console.log('openRoutes', openRoutes);
    if (config.features.login.open && !isUserLoggedIn() && !config.features.discover) {
      openRoutes.unshift({
        path: '/explorer',
        text: 'Explore',
      });
    }
    return openRoutes;
  }

  function featureRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) => (route.feature ? config.features[route.feature] : true))
      .map((route: Route) =>
        route.children ? { ...route, children: featureRoutes(route.children) } : route,
      );
  }
  const featured = featureRoutes(routes);

  if (userPrivileges.includes(PicsurePrivileges.SUPER)) {
    // All routes in feature for super users
    return featured;
  }

  function allowedRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) =>
        route.privilege ? route.privilege.some((priv) => userPrivileges.includes(priv)) : true,
      )
      .map((route: Route) =>
        route.children ? { ...route, children: allowedRoutes(route.children) } : route,
      );
  }
  return allowedRoutes(featured);
});

export async function getUser(force?: boolean, hasToken = false) {
  if (force || !get(user)?.privileges || !get(user)?.token) {
    const res: User = await api.get(`${Psama.User.Me}${hasToken ? '?hasToken' : ''}`);
    if (res.privileges && res.token) {
      for (const privilege of res.privileges) {
        if (privilege.includes(BDCPrivileges.PRIV_MANAGED)) {
          res.privileges.push(BDCPrivileges.AUTHORIZED_ACCESS);
          break;
        }
      }
    }
    user.set({ ...get(user), ...res });
  }
}

export function refreshLongTermToken() {
  return api.get(Psama.User.Refresh).then((response: { userLongTermToken: string }) => {
    if (!response.userLongTermToken) {
      throw new Error('No user token was returned.');
    }
    user.set({ ...get(user), token: response.userLongTermToken });
    return response.userLongTermToken;
  });
}

export const ACCESS_UNAVAILABLE_MESSAGE =
  'We could not load which studies you have access to. Studies you are authorized for may not ' +
  'be shown, and searching the data dictionary is unavailable. Please log out and log back in. ' +
  'If the problem persists, please contact an administrator.';

/** Delay before each attempt. Retry once straight away, then back off for a real outage. */
const CONSENTS_RETRY_DELAYS_MS = [0, 0, 3_000];

/**
 * Requires PSAMA to answer 200 with an empty map when a user has no consents; its 500 is
 * indistinguishable from a transient failure. Throws once attempts are exhausted rather than
 * returning `{}` - the dictionary treats an empty list as no filter and returns everything.
 */
export async function getConsents(): Promise<ConsentsMap> {
  for (const [attempt, delay] of CONSENTS_RETRY_DELAYS_MS.entries()) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const res = await api.get(Psama.User.Consents);
      return (res?.consents as ConsentsMap) || {};
    } catch (error) {
      if (attempt === CONSENTS_RETRY_DELAYS_MS.length - 1) {
        console.error(`Error fetching user consents after ${attempt + 1} attempts: ` + error);
        throw error;
      }
    }
  }
  throw new Error('unreachable');
}

let consentsRequest: Promise<void> = Promise.resolve();

/** Resolves once the in-flight access fetch has succeeded or given up. Never rejects. */
export const consentsSettled = () => consentsRequest;

/** Leaves `consents` undefined on failure - see `accessUnavailable`. */
export function loadConsents(): Promise<void> {
  user.set({ ...get(user), consents: undefined });
  consentsRequest = getConsents()
    .then((consents) => {
      user.set({ ...get(user), consents });
    })
    .catch(() => showAccessUnavailable());
  return consentsRequest;
}

/** Idempotent per visible toast, so repeated blocked requests do not stack up alerts. */
export function showAccessUnavailable() {
  if (isToastShowing('access-unavailable')) return;
  toaster.error({ id: 'access-unavailable', title: ACCESS_UNAVAILABLE_MESSAGE, closable: true });
}

/**
 * Populate the user store from PSAMA using the token in localStorage. Used by the login
 * flow and by the authorized layout when a fresh tab has a valid token but no user data
 * in sessionStorage (since sessionStorage is tab-scoped, each new tab starts empty).
 */
export async function hydrateUserFromToken() {
  await getUser(true, false);
  // Not awaited: see loadConsents. Consumers wait on consentsSettled() instead.
  loadConsents();
}

export async function login(token: string) {
  if (browser && token) {
    setToken(token);
    await hydrateUserFromToken();
  }
}

export async function logout(authProvider?: AuthProvider, redirect = false) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleErrors(error: any) {
    console.error('Error logging out: ' + error);
    handleLogout(redirect);
  }

  if (browser) {
    const token = localStorage.getItem('token');
    if (token) {
      await api.get(Psama.User.Logout).catch(handleErrors);
      removeToken();
    }
  }

  // get the auth provider
  if (authProvider) {
    await authProvider
      .logout()
      .then((redirectURL) => {
        log(createLog('AUTH', 'logout.success'));
        if (typeof redirectURL === 'string') {
          user.set({});
          location.replace(redirectURL);
        } else {
          // If no redirect is provided, go to the login page
          handleErrors(redirectURL);
        }
      })
      .catch(handleErrors);
  } else {
    handleLogout(redirect);
  }
}

function handleLogout(redirect: boolean) {
  user.set({});
  log(createLog('AUTH', 'logout.success'));
  if (redirect) {
    goto(resolve(`/login?redirectTo=${encodeURIComponent(page.url.pathname)}`));
  } else {
    goto(resolve('/login'));
  }
}

export function isTokenExpired(token: string) {
  try {
    return getTokenExpiration(token) < new Date().getTime();
  } catch (error) {
    console.error('Error checking token expiration: ' + error);
    log(createLog('AUTH', 'token.parse_error', { error: String(error) }));
    return true;
  }
}

export function getTokenExpiration(token: string) {
  if (!token) {
    throw new Error('No token provided.');
  }
  try {
    return JSON.parse(atob(token.split('.')[1])).exp * 1000;
  } catch (error) {
    throw new Error('Error parsing token: ' + error, { cause: error });
  }
}

export function getTokenExpirationAsDate(token: string) {
  try {
    return new Date(getTokenExpiration(token));
  } catch (error) {
    console.error('Error getting token expiration as date: ' + error);
    return undefined;
  }
}

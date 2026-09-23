import { resolve } from '$app/paths';
import { get, writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import * as api from '$lib/api';
import type { Route } from '$lib/models/Route';
import type { User } from '$lib/models/User';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { routes, config } from '$lib/configuration.svelte';
import { Psama } from '$lib/paths';
import { goto } from '$app/navigation';
import type AuthProvider from '$lib/models/AuthProvider.ts';
import { page } from '$app/state';
import { loginRedirectPath } from '$lib/utilities/LoginRedirect';
import { log, createLog } from '$lib/logger';
import { ensureAccess } from '$lib/state/access.svelte';
import { setToken, removeToken, onSessionChange, session } from '$lib/state/session.svelte';
export { getToken, setToken, removeToken } from '$lib/state/session.svelte';

export const user: Writable<User> = writable(restoreUser());
export const isTopAdmin = derived(user, ($user: User) => {
  return $user?.privileges?.includes(PicsurePrivileges.SUPER);
});
export const isAdmin = derived(user, ($user: User) => {
  return $user?.privileges?.includes(PicsurePrivileges.ADMIN);
});

// User data lives in sessionStorage (tab-scoped), not localStorage. Each tab has its own
// isolated user state, so opening the app in multiple tabs or logging out in one tab
// cannot leak stale admin/privileged data into another tab's UI. Token stays in
// localStorage because the API client reads it on every request and a fresh tab needs
// to know the user is already authenticated.
user.subscribe(($user: User) => {
  if (browser) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _, consents: _consents, ...userWithoutToken } = $user;
    sessionStorage.setItem('user', JSON.stringify(userWithoutToken));
  }
});

let userRequest: Promise<void> | undefined;

onSessionChange(() => {
  userRequest = undefined;
  user.set({});
});

export function clearSession() {
  removeToken();
  userRequest = undefined;
  user.set({});
  sessionStorage.removeItem('user');
}

function restoreUser() {
  if (!browser) return {};

  const token = localStorage.getItem('token');
  if (!token) {
    sessionStorage.removeItem('user');
    return {};
  }
  if (isTokenExpired(token)) {
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
    // Consents are fetched independently for each tab, never restored from a user snapshot.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { consents: _consents, ...profile } = stored;
    return profile;
  } catch (error) {
    console.error('Error reading user from session storage: ' + error);
    return {};
  }
}

export function isUserLoggedIn() {
  return session.authenticated;
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

export async function getUser(force = false, hasToken = false): Promise<void> {
  if (!force && get(user).privileges && (!hasToken || get(user).token)) return;
  if (userRequest) {
    await userRequest;
    if (hasToken && !get(user).token) return getUser(true, true);
    return;
  }
  const version = session.revision;
  const request = api
    .get(`${Psama.User.Me}${hasToken ? '?hasToken' : ''}`)
    .then((res: User) => {
      if (session.revision !== version) return;
      // Older API responses may include consents; access.svelte.ts owns that data now.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { consents: _, ...profile } = res;
      user.set({ ...get(user), ...profile });
    })
    .catch((error: unknown) => {
      if (session.revision === version) throw error;
    })
    .finally(() => {
      if (userRequest === request) userRequest = undefined;
    });
  userRequest = request;
  return request;
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

export async function hydrateUserFromToken(force = false) {
  const version = session.revision;
  await getUser(force);
  if (version !== session.revision || !session.authenticated) return;
  // Access failure does not invalidate authentication. The shared notice displays the error.
  await ensureAccess().catch(() => {});
}

export async function login(token: string) {
  if (browser && token) {
    setToken(token);
    await hydrateUserFromToken(true);
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
      const request = api.get(Psama.User.Logout);
      clearSession();
      await request.catch(handleErrors);
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
    goto(resolve(loginRedirectPath(page.url) as '/'));
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

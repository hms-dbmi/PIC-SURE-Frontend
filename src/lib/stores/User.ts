import { get, writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import * as api from '$lib/api';
import type { Route } from '$lib/models/Route';
import type { User } from '$lib/models/User';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { routes, features, resources } from '$lib/configuration';
import { Psama } from '$lib/paths';
import { goto } from '$app/navigation';
import type { QueryInterface } from '$lib/models/query/Query';
import type AuthProvider from '$lib/models/AuthProvider.ts';
import { page } from '$app/state';

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

export const isLoggedIn: Readable<boolean> = derived(tokenStatus, ($tokenStatus) => $tokenStatus);

user.subscribe((user: User) => {
  if (browser) {
    clearSessionTokenIfExpired();
    const userCopy: User = { ...user };
    // We don't want to save the long term token in local storage
    userCopy.token = undefined;
    localStorage.setItem('user', JSON.stringify(userCopy));
  }
});

export function setToken(token: string) {
  localStorage.setItem('token', token);
  tokenStatus.set(true);
}

export function removeToken() {
  localStorage.removeItem('token');
  tokenStatus.set(false);
}

function restoreUser() {
  if (browser && localStorage.getItem('user')) {
    clearSessionTokenIfExpired();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user || Object.keys(user).length === 0) {
        return {};
      }
      console.log('Restored user from local storage: ', user);
      return user;
    } catch (error) {
      console.error('Error reading user from local storage:  ' + error);
      return {};
    }
  }
  return {};
}

export function isUserLoggedIn() {
  if (browser) {
    return !!localStorage.getItem('token');
  }
  return false;
}

function clearSessionTokenIfExpired() {
  if (browser) {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      console.log('Clearing expired token from local storage.');
      removeToken();
    }
  }
}

export const userRoutes: Readable<Route[]> = derived([user, isLoggedIn], ([$user, $isLoggedIn]) => {
  const userPrivileges: string[] = $user?.privileges || [];

  if (userPrivileges.length === 0 || !$isLoggedIn) {
    // Public routes for non-logged in user
    return routes.filter((route) => !route.privilege);
  }

  function featureRoutes(routeList: Route[]): Route[] {
    return routeList
      .filter((route) => (route.feature ? !!features[route.feature] : true))
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

export async function getQueryTemplate(): Promise<QueryInterface> {
  try {
    const res = await api.get(Psama.User.Template + '/' + resources.application);
    const queryTemplate = JSON.parse(res.queryTemplate) as QueryInterface;
    return queryTemplate;
  } catch (error) {
    console.error('Error parsing query template: ' + error);
    return {} as QueryInterface;
  }
}

export async function login(token: string) {
  if (browser && token) {
    setToken(token);
    await getUser(true, false);
    if (features.useQueryTemplate) {
      const queryTemplate = await getQueryTemplate();
      if (queryTemplate) {
        user.set({ ...get(user), queryTemplate });
      }
    }
  }
}

export async function logout(authProvider?: AuthProvider, redirect = false) {
  if (browser) {
    const token = localStorage.getItem('token');
    if (token) {
      api.get(Psama.User.Logout).catch((error) => {
        console.error('Error logging out: ' + error);
      });
      removeToken();
    }
  }

  // get the auth provider
  if (authProvider) {
    authProvider
      .logout()
      .then((redirectURL) => {
        if (typeof redirectURL === 'string') {
          user.set({});
          location.replace(redirectURL);
        } else {
          // If no redirect is provided, go to the login page
          console.error('Error logging out: ' + redirectURL);
          handleLogout(redirect);
        }
      })
      .catch((error) => {
        console.error('Error logging out: ' + error);
        handleLogout(redirect);
      });
  } else {
    handleLogout(redirect);
  }
}

function handleLogout(redirect: boolean) {
  user.set({});
  if (redirect) {
    goto(`/login?redirectTo=${encodeURIComponent(page.url.pathname)}`);
  } else {
    goto('/login');
  }
}

export function isTokenExpired(token: string) {
  try {
    return getTokenExpiration(token) < new Date().getTime();
  } catch (error) {
    console.error('Error checking token expiration: ' + error);
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
    throw new Error('Error parsing token: ' + error);
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

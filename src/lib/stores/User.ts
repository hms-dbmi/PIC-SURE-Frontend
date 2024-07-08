import { get, writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

import * as api from '$lib/api';
import type { Route } from '$lib/models/Route';
import type { User } from '$lib/models/User';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { routes, features } from '$lib/configuration';
import { goto } from '$app/navigation';
import SearchStore from '$lib/stores/Search';

export const user: Writable<User> = writable(restoreUser());

user.subscribe((user: User) => {
  if (browser) {
    clearSessionTokenIfExpired();
    const userCopy: User = { ...user };
    // We don't want to save the long term token in local storage
    userCopy.token = undefined;
    localStorage.setItem('user', JSON.stringify(userCopy));
  }
});

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

function clearSessionTokenIfExpired() {
  if (browser) {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      console.log('Clearing expired token from local storage.');
      localStorage.removeItem('token');
    }
  }
}

export const userRoutes: Readable<Route[]> = derived(user, ($user) => {
  const userPrivileges: string[] = $user?.privileges || [];

  if (userPrivileges.length === 0) {
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
      .filter((route) => (route.privilege ? userPrivileges.includes(route.privilege) : true))
      .map((route: Route) =>
        route.children ? { ...route, children: allowedRoutes(route.children) } : route,
      );
  }
  return allowedRoutes(featured);
});

export async function getUser(force?: boolean) {
  if (force || !get(user)?.privileges || !get(user)?.token) {
    const res = await api.get('psama/user/me?hasToken');
    user.set(res);
  }
}

export async function refreshLongTermToken() {
  const newLongTermToken = await api
    .get('psama/user/me/refresh_long_term_token')
    .then((response: { userLongTermToken: string }) => {
      if (!response.userLongTermToken) {
        throw new Error('No user token was returned.');
      }
      return response.userLongTermToken;
    });
  user.set({ ...get(user), token: newLongTermToken });
}

export async function login(token: string) {
  if (browser && token) {
    localStorage.setItem('token', token);
    await getUser(true);
  }
}

export async function logout() {
  if (browser) {
    localStorage.removeItem('token');
  }
  SearchStore.searchResults.set([]);
  user.set({});
  goto('/login');
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

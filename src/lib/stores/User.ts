import { get, writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

import * as api from '$lib/api';
import type { Route } from '$lib/models/Route';
import type { User } from '$lib/models/User';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { routes, features } from '$lib/configuration';

export const user: Writable<User> = writable({});
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

export async function refreshToken() {
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
    sessionStorage.setItem('token', token);
    await getUser(true);
  }
}

export async function logout() {
  if (browser) {
    sessionStorage.removeItem('token');
  }
  user.set({});
}

import { get, writable, derived, type Writable, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

import * as api from '$lib/api';
import type { Route } from '$lib/models/Route';
import type { User } from '$lib/models/User';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { routes, features } from '$lib/configuration';

function initFromSession(){
  if(!browser) return {};
  const sessionUser = JSON.parse(sessionStorage.getItem("userStore") || "{}");

  if(sessionUser?.expirationDate < new Date().toISOString()){
    sessionStorage.setItem('userStore', '{}');
    return {};
  } else {
    return sessionUser;
  }
}

export const user: Writable<User> = writable(initFromSession());
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
console.log('user store init');
user.subscribe(userData => { browser && sessionStorage.setItem("userStore", JSON.stringify(userData)); });
user.subscribe(userData => { console.log('user value change', userData); });

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

export async function login(authUser: User) {
  const psamaUser = await api.send({ method: 'GET', path: 'psama/user/me?hasToken', token: authUser.token });
  user.set({
    ...authUser,
    uuid: psamaUser.uuid,
    privileges: psamaUser.privileges,
    apiToken: psamaUser.token,
  });
}

export async function logout() {
  if (browser) {
    sessionStorage.removeItem('userStore');
  }
  user.set({});
}

export function expired(){
  const userData = get(user);
  if(!userData.expirationDate) return false;

  return userData?.expirationDate < new Date().toISOString();
}
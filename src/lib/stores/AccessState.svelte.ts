import { readable } from 'svelte/store';
import { page } from '$app/state';
import { features } from '$lib/configuration';
import { isUserLoggedIn } from '$lib/stores/User';

export const useAuth = readable(() => {
  return !features.login.open || isUserLoggedIn();
});

export const openUsersOnly = readable(() => {
  if (page.url.pathname.includes('/discover')) {
    return true;
  }
  return !isUserLoggedIn() && features.explorer.open;
});

export const authorizedUsersOnly = readable(() => {
  return isUserLoggedIn() && !features.explorer.open;
});
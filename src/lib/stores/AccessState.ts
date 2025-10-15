import { readable } from 'svelte/store';
import { page } from '$app/state';
import { features } from '$lib/configuration';
import { isUserLoggedIn } from '$lib/stores/User';
import { browser } from '$app/environment';

export const useAuth = readable(!features.login.open || isUserLoggedIn());

export const openUsersOnly = readable(
  (browser && page.url.pathname.includes('/discover')) ||
    (!isUserLoggedIn() && features.explorer.open),
);

export const authorizedUsersOnly = readable(isUserLoggedIn() && !features.explorer.open);

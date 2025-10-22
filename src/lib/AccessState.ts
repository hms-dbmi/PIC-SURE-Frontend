import { page } from '$app/state';
import { features } from '$lib/configuration';
import { isUserLoggedIn } from '$lib/stores/User';
import { browser } from '$app/environment';

export function useAuth(): boolean {
  return !features.login.open || isUserLoggedIn();
}

export function isOpenAccess(): boolean {
  return (browser && page.url.pathname.includes('/discover')) || !isUserLoggedIn();
}

export function isAuthorizedAccess(): boolean {
  return isUserLoggedIn() && !features.explorer.open;
}

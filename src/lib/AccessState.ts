import { page } from '$app/state';
import { isUserLoggedIn } from '$lib/stores/User';
import { browser } from '$app/environment';
import { config } from '$lib/configuration.svelte';

export function isOpenAccess(): boolean {
  return (browser && page.url.pathname.includes('/discover')) || !isUserLoggedIn();
}

export function isExploreWithoutLogin(): boolean {
  return Boolean(config.features.explorer.open && config.features.login.open);
}

export function useOpenAccess(isOpen?: boolean) {
  let openAccess = isOpen;
  if (typeof openAccess === 'undefined') {
    openAccess = isOpenAccess();
  }
  return openAccess && !isExploreWithoutLogin();
}

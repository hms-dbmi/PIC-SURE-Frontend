import { page } from '$app/state';
import { isUserLoggedIn } from '$lib/stores/User';
import { browser } from '$app/environment';
import { config } from '$lib/configuration.svelte';

export function isOpenAccess(): boolean {
  return (browser && page.url.pathname.includes('/discover')) || !isUserLoggedIn();
}

/** Open access bars filtering on the variables the dictionary marks unfilterable. */
export function filteringBlocked(variable: { allowFiltering?: boolean }): boolean {
  return isOpenAccess() && !variable.allowFiltering;
}

export function useOpenAccess(isOpen?: boolean) {
  let openAccess = isOpen;
  if (typeof openAccess === 'undefined') {
    openAccess = isOpenAccess();
  }
  const isExploreWithoutLogin = config.features.explorer.open && config.features.login.open;
  return openAccess && !isExploreWithoutLogin;
}

import { page } from '$app/state';
import { isUserLoggedIn } from '$lib/stores/User';
import { browser } from '$app/environment';
import { features } from '$lib/configuration';

export function isOpenAccess(): boolean {
  return (browser && page.url.pathname.includes('/discover')) || !isUserLoggedIn();
}

export function isExploreWithoutLogin(): boolean {
  return Boolean(features.explorer.open && features.login.open);
}

export function useOpenAccess(isOpen?: boolean) {
  let openAccess = isOpen;
  if (typeof openAccess === 'undefined') {
    openAccess = isOpenAccess();
  }
  return openAccess && !isExploreWithoutLogin();
}

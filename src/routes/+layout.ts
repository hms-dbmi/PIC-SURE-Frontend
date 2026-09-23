import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { config, applyConfig } from '$lib/configuration.svelte';
import { clearSession, hydrateUserFromToken, isTokenExpired, getToken } from '$lib/stores/User';
import { loginRedirectPath } from '$lib/utilities/LoginRedirect';
import { log, createLog } from '$lib/logger';

export const load: LayoutLoad = async ({ url, fetch, data }) => {
  // Runs on both SSR and the client's hydration-time re-run of this load, off the
  // same serialized data.configCache - so the first server render and the client's
  // initial state agree, avoiding the hydration flash this used to cause.
  applyConfig(data.configCache);

  if (!browser) return;
  if (!url.pathname.startsWith('/login') && getToken()) {
    if (isTokenExpired(getToken())) {
      clearSession();
    } else {
      try {
        await hydrateUserFromToken();
      } catch (error) {
        log(createLog('AUTH', 'auth.hydrate_failed', { error: String(error) }));
        clearSession();
        redirect(302, loginRedirectPath(url));
      }
    }
  }
  if (
    !config.features.login.open &&
    !localStorage.getItem('token') &&
    !url.pathname.includes('/login')
  ) {
    clearSession();
    redirect(302, '/login');
  }
  try {
    const response = await fetch(url.pathname);
    if (response.status === 404) {
      redirect(302, '/');
    }
  } catch {
    redirect(302, '/');
  }
};

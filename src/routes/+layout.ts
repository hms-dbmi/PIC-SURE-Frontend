import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { config, applyConfig } from '$lib/configuration.svelte';
import { user, isUserLoggedIn } from '$lib/stores/User';

export const load: LayoutLoad = async ({ url, fetch, data }) => {
  // Runs on both SSR and the client's hydration-time re-run of this load, off the
  // same serialized data.configCache - so the first server render and the client's
  // initial state agree, avoiding the hydration flash this used to cause.
  applyConfig(data.configCache);

  const isLoginRoute = url.pathname.includes('/login');
  const isRegisterRoute = url.pathname.includes('/register');

  // Config-only check, so it can redirect during SSR instead of flashing the register form.
  if (isRegisterRoute && !config.features.registerPage) {
    redirect(302, '/');
  }

  // Everything past here needs localStorage, which only exists once we're in the browser.
  if (!browser) return;

  if (
    !config.features.login.open &&
    !localStorage.getItem('token') &&
    !isLoginRoute &&
    !isRegisterRoute
  ) {
    user && user.set({});
    redirect(302, '/login');
  }

  // Same registerPage gate as above, but for the logged-in case, which only localStorage can tell us.
  if (isRegisterRoute && isUserLoggedIn()) {
    redirect(302, '/');
  }

  try {
    const response = await fetch(url.pathname);
    if (response.status === 404) redirect(302, '/');
  } catch {
    redirect(302, '/');
  }
};

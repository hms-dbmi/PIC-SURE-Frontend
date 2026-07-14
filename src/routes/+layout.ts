import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { config, applyConfig } from '$lib/configuration.svelte';
import { user } from '$lib/stores/User';

export const load: LayoutLoad = async ({ url, fetch, data }) => {
  // Runs on both SSR and the client's hydration-time re-run of this load, off the
  // same serialized data.configCache - so the first server render and the client's
  // initial state agree, avoiding the hydration flash this used to cause.
  applyConfig(data.configCache);

  if (!browser) return;
  if (
    !config.features.login.open &&
    !localStorage.getItem('token') &&
    !url.pathname.includes('/login')
  ) {
    user && user.set({});
    redirect(302, '/login');
  }
  try {
    const response = await fetch(url.pathname);
    if (response.status === 404) {
      redirect(302, '/');
    }
  } catch (error) {
    redirect(302, '/');
  }
};

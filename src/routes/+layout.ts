import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { config } from '$lib/configuration.svelte';
import { user } from '$lib/stores/User';
import { getConfigs } from '$lib/configuration.svelte';

export const load: LayoutLoad = async ({ url, fetch }) => {
  if (browser) {
    await getConfigs();
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
  }
};

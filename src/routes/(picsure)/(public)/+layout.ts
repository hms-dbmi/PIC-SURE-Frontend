import { config } from '$lib/configuration.svelte';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from '../../$types';

export const load: LayoutLoad = async ({ url, parent }) => {
  if (!browser) return;

  if (!config.features.discover && url.pathname.includes('/discover')) {
    redirect(302, '/explorer');
  }
  if (!config.features.explorer && url.pathname.includes('/explorer')) {
    redirect(302, '/discover');
  }
};

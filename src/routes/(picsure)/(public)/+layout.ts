import { config } from '$lib/configuration.svelte';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from '../../$types';

export const load: LayoutLoad = async ({ url }) => {
  if (!config.features.discover && url.pathname.includes('/discover')) {
    redirect(302, '/explorer');
  }
  if (!config.features.explorer && url.pathname.includes('/explorer')) {
    redirect(302, '/discover');
  }
};

import { config } from '$lib/configuration.svelte';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from '../../$types';

export const load: LayoutLoad = async ({ url, parent }) => {
  if (!browser) return;
  // Root layout's load applies config from data.configCache - it isn't guaranteed
  // to have run yet by the time this load starts (sibling/child loads run
  // concurrently unless ordered via parent()), so wait for it before reading config.
  await parent();

  if (!config.features.discover && url.pathname.includes('/discover')) {
    redirect(302, '/explorer');
  }
};

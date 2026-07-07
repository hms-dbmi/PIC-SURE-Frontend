import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/configuration.svelte';
import { browser } from '$app/environment';

export const prerender = false;

export const load: LayoutLoad = () => {
  // config.features is only populated client-side (see hooks.client.ts); on SSR
  // it's still the hardcoded defaults, so this guard must not run server-side.
  if (!browser) return;

  if (!config.features.collaborate) {
    redirect(302, '/');
  }
};

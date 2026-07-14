import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/configuration.svelte';
import { browser } from '$app/environment';

export const prerender = false;

export const load: LayoutLoad = async ({ parent }) => {
  // config is applied by the root layout's load (see src/routes/+layout.ts); on SSR
  // it's still the hardcoded defaults, so this guard must not run server-side. On
  // the client, sibling/child loads run concurrently with the root's unless
  // ordered via parent(), so wait for it before reading config.
  if (!browser) return;
  await parent();

  if (!config.features.collaborate) {
    redirect(302, '/');
  }
};

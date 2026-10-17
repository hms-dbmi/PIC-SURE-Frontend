import { redirect } from '@sveltejs/kit';
import { config } from '#lib/config/config.svelte.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  // The root layout applies config; wait for it before reading the flag.
  await parent();
  if (!config.features.dashboard) {
    redirect(302, '/');
  }
};

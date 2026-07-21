import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/configuration.svelte';

export const prerender = false;

export const load: LayoutLoad = async ({ parent }) => {
  // Root layout's load applies config from data.configCache synchronously, before
  // its own load promise resolves (see src/routes/+layout.ts) - await parent() to
  // guarantee it's already applied here, on both SSR and the client, so this gate
  // enforces the same as it did on the pre-config-API main branch.
  await parent();

  if (!config.features.collaborate) {
    redirect(302, '/');
  }
};

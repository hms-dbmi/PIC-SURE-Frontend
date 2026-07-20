import { config } from '$lib/configuration.svelte';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from '../../$types';

export const load: LayoutLoad = async ({ url, parent }) => {
  // Root layout's load applies config from data.configCache synchronously, before
  // its own load promise resolves (see src/routes/+layout.ts) - await parent() to
  // guarantee it's already applied here, on both SSR and the client, so this gate
  // enforces the same as it did on the pre-config-API main branch.
  await parent();

  if (!config.features.discover && url.pathname.includes('/discover')) {
    redirect(302, '/explorer');
  }
};

import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/env';
import { config, applyConfig } from '#lib/configuration.svelte.ts';
import { user } from '#lib/stores/User.ts';
import { loginRedirectPath } from '#lib/utilities/LoginRedirect.ts';

export const load: LayoutLoad = ({ url, data }) => {
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
    user.set({});
    redirect(302, loginRedirectPath(url));
  }
};

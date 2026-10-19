import type { LayoutLoad } from './$types';
import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired, isUserLoggedIn } from '#lib/auth/User.ts';
import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
import { LOGOUT_REASON_KEY, readToken } from '#lib/auth/token.ts';
import { config } from '#lib/config/config.svelte.ts';

export const load: LayoutLoad = async ({ url, parent }) => {
  if (!browser) return;
  // Root layout's load applies config from data.configCache - it isn't guaranteed
  // to have run yet by the time this load starts (sibling/child loads run
  // concurrently unless ordered via parent()), so wait for it before reading config.
  await parent();
  if (config.features.explorer.open) {
    return;
  }

  if (!isUserLoggedIn()) {
    browser &&
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'You must be logged in to access Explore.');
    redirect(302, loginRedirectPath(url));
  }

  const token = readToken();
  if (!token || token.trim() === '') {
    browser &&
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'You must be logged in to access Explore.');
    redirect(302, loginRedirectPath(url));
  }

  if (isTokenExpired(token)) {
    browser &&
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'Your session has timed out. Please log in again.');
    redirect(302, loginRedirectPath(url));
  }
};

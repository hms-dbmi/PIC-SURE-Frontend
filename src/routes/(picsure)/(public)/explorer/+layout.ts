import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired, isUserLoggedIn } from '$lib/stores/User';
import { loginRedirectPath } from '$lib/utilities/LoginRedirect';
import { config } from '$lib/configuration.svelte';

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
    browser && sessionStorage.setItem('logout-reason', 'You must be logged in to access Explore.');
    redirect(302, loginRedirectPath(url));
  }

  const token = localStorage.getItem('token');
  if (!token || token.trim() === '') {
    browser && sessionStorage.setItem('logout-reason', 'You must be logged in to access Explore.');
    redirect(302, loginRedirectPath(url));
  }

  if (isTokenExpired(token)) {
    browser &&
      sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in again.');
    redirect(302, loginRedirectPath(url));
  }
};

import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired, isUserLoggedIn } from '$lib/stores/User';
import { config } from '$lib/configuration.svelte';

export const load: LayoutLoad = ({ url }) => {
  if (!browser || config.features.explorer.open) {
    return;
  }

  if (!isUserLoggedIn()) {
    browser && sessionStorage.setItem('logout-reason', 'You must be logged in to access Explore.');
    redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  const token = localStorage.getItem('token');
  if (!token || token.trim() === '') {
    browser && sessionStorage.setItem('logout-reason', 'You must be logged in to access Explore.');
    console.log('token redirect', browser, config.features.explorer.open, isUserLoggedIn());
    redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  try {
    if (isTokenExpired(token)) {
      browser &&
        sessionStorage.setItem('logout-reason', 'Your session has timed out. Please log in again.');
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
  } catch (error) {
    console.error('Error checking token expiration:', error);
    redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }
};

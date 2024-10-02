import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired } from '$lib/stores/User';

export const load: LayoutLoad = ({ url }) => {
  if (browser) {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    try {
      if (isTokenExpired(token)) {
        throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
  }
};

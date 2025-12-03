import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired, isUserLoggedIn } from '$lib/stores/User';
import { useAuth } from '$lib/AccessState';

export const load: LayoutLoad = ({ url }) => {
  if (browser && useAuth()) {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    try {
      if (isTokenExpired(token)) {
        redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
  }
};

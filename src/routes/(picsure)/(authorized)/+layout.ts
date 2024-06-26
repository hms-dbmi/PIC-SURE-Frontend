import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired } from '$lib/stores/User';

export const load: LayoutLoad = ({ url }) => {
  if (
    browser &&
    (!localStorage.getItem('token') || isTokenExpired(localStorage.getItem('token') || ''))
  ) {
    throw redirect(303, `/login?redirectTo=${url.pathname}`);
  }
};

import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { features } from '$lib/configuration';
import { isTokenExpired } from '$lib/stores/User';
import { browser } from '$app/environment';

export const load: LayoutLoad = ({ url }) => {
  if (
    !features.login.open &&
    browser &&
    (!localStorage.getItem('token') || isTokenExpired(localStorage.getItem('token') || ''))
  ) {
    throw redirect(302, `/login?redirectTo=${url.pathname}`);
  }
};

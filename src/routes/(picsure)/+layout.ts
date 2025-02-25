import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { features } from '$lib/configuration';
import { isTokenExpired, user } from '$lib/stores/User';
import { browser } from '$app/environment';

export const load: LayoutLoad = ({ url }) => {
  if (
    !features.login.open &&
    browser &&
    (!sessionStorage.getItem('token') || isTokenExpired(sessionStorage.getItem('token') || ''))
  ) {
    user.set({});
    throw redirect(302, `/login?redirectTo=${url.pathname}`);
  }
};

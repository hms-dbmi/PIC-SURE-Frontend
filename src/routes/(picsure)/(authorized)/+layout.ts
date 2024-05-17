import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const load: LayoutLoad = ({ url }) => {
  console.log('layout load');
  if (browser && !sessionStorage.getItem('token')) {
    throw redirect(303, `/login?redirectTo=${url.pathname}`);
  }
};

import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { features } from '$lib/stores/Configuration';
import { isTokenExpired, user } from '$lib/stores/User';
import { browser } from '$app/environment';

export const load: LayoutLoad = ({ url }) => {
  if (
    !get(features).login.open &&
    browser &&
    (!localStorage.getItem('token') || isTokenExpired(localStorage.getItem('token') || ''))
  ) {
    user.set({});
    redirect(302, `/login?redirectTo=${url.pathname}`);
  }
};

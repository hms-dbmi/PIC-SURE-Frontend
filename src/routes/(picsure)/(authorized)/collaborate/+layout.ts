import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { features } from '$lib/configuration';

export const prerender = false;

export const load: LayoutLoad = () => {
  if (!features.collaborate) {
    redirect(302, '/');
  }
};

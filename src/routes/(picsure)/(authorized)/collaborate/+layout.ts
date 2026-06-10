import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/configuration.svelte';

export const prerender = false;

export const load: LayoutLoad = () => {
  if (!config.features.collaborate) {
    redirect(302, '/');
  }
};

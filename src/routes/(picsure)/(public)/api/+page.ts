import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { config } from '$lib/configuration.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  // Root layout's load applies config from data.configCache - it isn't guaranteed
  // to have run yet by the time this load starts (sibling/child loads run
  // concurrently unless ordered via parent()), so wait for it before reading config.
  await parent();
  if (!config.features.analyzeApi) {
    redirect(302, '/');
  }
  // Release 1: the API page is for logged-in users only.
  if (browser && !localStorage.getItem('token')) {
    redirect(302, '/');
  }
};

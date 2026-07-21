import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/configuration.svelte';
import { browser } from '$app/environment';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = async ({ url, parent }) => {
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (
      !userPrivileges.includes(PicsurePrivileges.API_ACCESS) &&
      !userPrivileges.includes(BDCPrivileges.AUTHORIZED_ACCESS)
    ) {
      redirect(302, '/');
    }
    // Root layout's load applies config from data.configCache - it isn't guaranteed
    // to have run yet by the time this load starts (sibling/child loads run
    // concurrently unless ordered via parent()), so wait for it before reading config.
    await parent();
    if (config.features.analyzeApi && url.pathname === '/analyze') {
      redirect(302, `/analyze/api`);
    }
  }
};

import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { features } from '$lib/configuration';
import { browser } from '$app/environment';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (!userPrivileges.includes(PicsurePrivileges.API_ACCESS) && !userPrivileges.includes(BDCPrivileges.AUTHORIZED_ACCESS)) {
      redirect(302, '/');
    }
    if (
      features.analyzeApi &&
      url.pathname === '/analyze' &&
      !url.pathname.includes('/api') &&
      !url.pathname.includes('/analysis') &&
      !url.pathname.includes('/example')
    ) {
      redirect(302, `/analyze/api`);
    }
    if (
      features.analyzeAnalysis &&
      url.pathname === '/analyze' &&
      !url.pathname.includes('/api') &&
      !url.pathname.includes('/analysis') &&
      !url.pathname.includes('/example')
    ) {
      redirect(302, `/analyze/analysis`);
    }
  }
};

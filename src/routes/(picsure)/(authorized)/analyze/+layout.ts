import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/configuration.svelte';
import { browser } from '$app/environment';

export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  if (browser) {
    if (
      config.features.analyzeApi &&
      url.pathname === '/analyze' &&
      !url.pathname.includes('/api') &&
      !url.pathname.includes('/analysis') &&
      !url.pathname.includes('/example')
    ) {
      redirect(302, `/analyze/api`);
    }
    if (
      config.features.analyzeAnalysis &&
      url.pathname === '/analyze' &&
      !url.pathname.includes('/api') &&
      !url.pathname.includes('/analysis') &&
      !url.pathname.includes('/example')
    ) {
      redirect(302, `/analyze/analysis`);
    }
  }
};

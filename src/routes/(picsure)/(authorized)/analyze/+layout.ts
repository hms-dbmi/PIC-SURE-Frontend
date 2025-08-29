import { get } from 'svelte/store';
import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { features } from '$lib/stores/Configuration';
import { browser } from '$app/environment';

export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  const _features = get(features);
  if (browser) {
    if (
      _features.analyzeApi &&
      url.pathname === '/analyze' &&
      !url.pathname.includes('/api') &&
      !url.pathname.includes('/analysis') &&
      !url.pathname.includes('/example')
    ) {
      redirect(302, `/analyze/api`);
    }
    if (
      _features.analyzeAnalysis &&
      url.pathname === '/analyze' &&
      !url.pathname.includes('/api') &&
      !url.pathname.includes('/analysis') &&
      !url.pathname.includes('/example')
    ) {
      redirect(302, `/analyze/analysis`);
    }
  }
};

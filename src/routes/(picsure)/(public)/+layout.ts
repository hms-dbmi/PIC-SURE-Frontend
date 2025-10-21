import { features } from '$lib/configuration';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from '../../$types';

export const load: LayoutLoad = async ({ url }) => {
  if (!features.discover && url.pathname.includes('/discover')) {
    redirect(302, '/explore');
  }
  if (!features.explorer && url.pathname.includes('/explorer')) {
    redirect(302, '/discover');
  }
  if (!features.analyzeApi && features.analyzeAnalysis && url.pathname.includes('/analyze/api')) {
    redirect(302, '/analyze/analysis');
  }
  if (
    !features.analyzeAnalysis &&
    features.analyzeApi &&
    url.pathname.includes('/analyze/analysis')
  ) {
    redirect(302, '/analyze/api');
  }
};

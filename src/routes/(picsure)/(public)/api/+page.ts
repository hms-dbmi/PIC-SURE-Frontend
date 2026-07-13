import { redirect } from '@sveltejs/kit';
import { features } from '$lib/configuration';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  if (!features.analyzeApi) {
    redirect(302, '/');
  }
};

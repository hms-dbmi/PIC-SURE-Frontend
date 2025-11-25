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
};

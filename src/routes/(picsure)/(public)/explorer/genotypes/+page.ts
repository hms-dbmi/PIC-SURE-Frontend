import { redirect } from '@sveltejs/kit';

import { isDiscoverSection } from '$lib/explorer/searchChrome';
import { genotypesMode } from '$lib/explorer/searchModes';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, parent }) => {
  // Root layout's load applies config from data.configCache - await parent() to guarantee
  // it is applied before this reads it, on both SSR and the client.
  await parent();

  // The mode bar hides the link when genomic search is off, but the URL is still reachable
  // by hand, by bookmark and by browser history. Gate the route on the same rule.
  if (!genotypesMode.enabled(isDiscoverSection(url.pathname))) {
    redirect(302, '/explorer');
  }
};

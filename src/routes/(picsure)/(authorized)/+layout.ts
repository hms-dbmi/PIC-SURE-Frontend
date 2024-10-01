import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired } from '$lib/stores/User';

import { get } from 'svelte/store';
import { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter } from '$lib/stores/Filter';
import { getModalStore } from '@skeletonlabs/skeleton';
import FilterWarning from '$lib/components/FilterWarning.svelte';

export const load: LayoutLoad = ({ url }) => {
  if (browser) {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    try {
      if (isTokenExpired(token)) {
        throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      throw redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
  }
  if (browser) {
    const modalStore = getModalStore();

    if (get(hasInvalidFilter) && url.pathname.includes('/explorer')) {
      modalStore.trigger({
        type: 'component',
        component: 'modalWrapper',
        meta: { component: FilterWarning, width: 'w-3/4' },
      });
      throw redirect(302, url.pathname);
    } else if ((get(hasGenomicFilter) || get(hasUnallowedFilter)) && url.pathname.includes('/discover')) {
      modalStore.trigger({
        type: 'component',
        component: 'modalWrapper',
        meta: { component: FilterWarning, width: 'w-3/4' },
      });
      throw redirect(302, url.pathname);
    }
  }
};

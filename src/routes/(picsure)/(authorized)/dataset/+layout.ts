import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  if (browser) {
    if (url.pathname === '/dataset/request') return;

    const userPrivileges = get(user)?.privileges || [];
    if (
      url.pathname.includes('/dataset') &&
      !(
        userPrivileges.includes(PicsurePrivileges.NAMED_DATASET) ||
        userPrivileges.includes(BDCPrivileges.NAMED_DATASET)
      )
    ) {
      redirect(302, '/');
    }
  }
};

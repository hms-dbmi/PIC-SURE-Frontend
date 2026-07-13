import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = () => {
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (
      !userPrivileges.includes(PicsurePrivileges.API_ACCESS) &&
      !userPrivileges.includes(BDCPrivileges.AUTHORIZED_ACCESS)
    ) {
      redirect(302, '/');
    }
  }
};

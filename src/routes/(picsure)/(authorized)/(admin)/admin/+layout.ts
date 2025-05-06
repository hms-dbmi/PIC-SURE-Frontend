import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { user } from '$lib/stores/User';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = () => {
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (
      !userPrivileges.includes(PicsurePrivileges.SUPER) &&
      !userPrivileges.includes(PicsurePrivileges.ADMIN)
    ) {
      throw redirect(302, '/');
    }
  }
};

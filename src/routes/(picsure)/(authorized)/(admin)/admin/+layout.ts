import type { LayoutLoad } from './$types';
import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { user, isTopAdmin } from '#lib/stores/User.ts';
import { PicsurePrivileges } from '#lib/models/Privilege.ts';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = async ({ parent }) => {
  // Wait for the authorized layout to load the user in a fresh tab.
  await parent();
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (!get(isTopAdmin) && !userPrivileges.includes(PicsurePrivileges.ADMIN)) {
      throw redirect(302, '/');
    }
  }
};

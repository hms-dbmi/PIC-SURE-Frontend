import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/env';
import { BDCPrivileges, PicsurePrivileges } from '#lib/models/Privilege.ts';
import { user } from '#lib/stores/User.ts';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = async ({ parent }) => {
  // Wait for the authorized layout to load the user in a fresh tab.
  await parent();
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (
      !(
        userPrivileges.includes(PicsurePrivileges.NAMED_DATASET) ||
        userPrivileges.includes(BDCPrivileges.NAMED_DATASET)
      )
    ) {
      redirect(302, '/');
    }
  }
};

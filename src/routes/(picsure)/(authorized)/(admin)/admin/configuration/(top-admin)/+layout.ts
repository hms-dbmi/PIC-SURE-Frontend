import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTopAdmin } from '$lib/stores/User';
import { get } from 'svelte/store';

// Role, privilege, and connection management is top admin only: PSAMA rejects their writes
// for plain admins, and the Access Control tab is hidden from them.
export const load: LayoutLoad = async ({ parent }) => {
  // Wait for the authorized layout to load the user in a fresh tab.
  await parent();
  if (browser && !get(isTopAdmin)) {
    redirect(302, '/admin/configuration');
  }
};

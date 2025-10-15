import type { LayoutLoad } from './../$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { user } from '$lib/stores/User';
import { get } from 'svelte/store';

export const prerender = false;

export const load: LayoutLoad = () => {
  if (browser) {
    const userPrivileges = get(user)?.privileges || [];
    if (!userPrivileges.includes(PicsurePrivileges.NAMED_DATASET)) {
      redirect(302, '/');
    }
  }
};

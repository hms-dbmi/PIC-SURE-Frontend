import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';

export const load: LayoutLoad = async ({ url, fetch }) => {
  if (browser) {
    try {
      const response = await fetch(url.pathname);
      if (response.status === 404) {
        redirect(302, '/');
      }
    } catch (error) {
      redirect(302, '/');
    }
  }
};

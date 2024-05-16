import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const load: LayoutLoad = ({ url }) => {
  console.log('authorized layout load');
  if (browser) {
    const user = JSON.parse(sessionStorage.getItem('userStore') || "{}");
    if(!user.token){
      throw redirect(303, `/login?redirectTo=${url.pathname}`);
    }
  }
};

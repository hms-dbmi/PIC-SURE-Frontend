import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { isTokenExpired, user } from '$lib/stores/User';
import { PicsurePrivileges } from '$lib/models/Privilege';
import { get } from 'svelte/store';
import { features } from '$lib/configuration';
import { log, createLog } from '$lib/logger';

export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
  if (browser) {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      log(createLog('AUTH', 'auth.redirect_no_token', { targetUrl: url.pathname }));
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    const userPrivileges = get(user)?.privileges || [];
    if (!userPrivileges.includes(PicsurePrivileges.QUERY)) {
      log(
        createLog('AUTH', 'auth.redirect_no_privilege', {
          targetUrl: url.pathname,
          missingPrivilege: 'QUERY',
        }),
      );
      redirect(302, '/');
    }
    if (!features.analyzeApi && features.analyzeAnalysis && url.pathname.includes('/analyze/api')) {
      redirect(302, '/analyze/analysis');
    }
    if (
      !features.analyzeAnalysis &&
      features.analyzeApi &&
      url.pathname.includes('/analyze/analysis')
    ) {
      redirect(302, '/analyze/api');
    }
    try {
      if (isTokenExpired(token)) {
        log(createLog('AUTH', 'auth.redirect_token_expired', { targetUrl: url.pathname }));
        redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
  }
};

import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { clearSession, hydrateUserFromToken, isTokenExpired, user } from '$lib/stores/User';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';
import { get } from 'svelte/store';
import { features } from '$lib/configuration';
import { log, createLog } from '$lib/logger';

export const prerender = false;

export const load: LayoutLoad = async ({ url }) => {
  if (browser) {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      log(createLog('AUTH', 'auth.redirect_no_token', { targetUrl: url.pathname }));
      clearSession();
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    // isTokenExpired handles its own parse errors internally (returns true on failure),
    // so we don't need a try/catch here — the only other thing that throws is redirect()
    // itself, which SvelteKit is meant to catch.
    if (isTokenExpired(token)) {
      log(createLog('AUTH', 'auth.redirect_token_expired', { targetUrl: url.pathname }));
      clearSession();
      redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    // user lives in sessionStorage (tab-scoped), so a fresh tab with a valid token has an
    // empty user store. Hydrate from PSAMA before the privilege check — otherwise the user
    // would be bounced to / despite having a valid session.
    if (!get(user)?.privileges) {
      try {
        await hydrateUserFromToken();
      } catch (error) {
        console.error('Failed to hydrate user from token:', error);
        log(createLog('AUTH', 'auth.hydrate_failed', { error: String(error) }));
        clearSession();
        redirect(302, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
      }
    }
    const userPrivileges = get(user)?.privileges || [];
    if (
      !userPrivileges.includes(PicsurePrivileges.QUERY) &&
      !userPrivileges.includes(BDCPrivileges.AUTHORIZED_ACCESS)
    ) {
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
  }
};

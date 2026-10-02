<script lang="ts">
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/paths.ts';
  import type { Snippet } from 'svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import { clearSession, isTokenExpired } from '#lib/stores/User.ts';
  import { loginRedirectPath } from '#lib/utilities/LoginRedirect.ts';
  import { log, createLog } from '#lib/logger.ts';

  let { children }: { children?: Snippet } = $props();

  // The +layout.ts load function checks token expiry on initial navigation, but SvelteKit
  // won't re-run it when navigating to the same URL (e.g. clicking "Explorer" while already
  // on /explorer). beforeNavigate fires on every navigation attempt, catching that gap.
  beforeNavigate(({ to, cancel }) => {
    if (to && to.url.origin !== location.origin) return;
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      cancel();
      log(createLog('AUTH', 'auth.redirect_token_expired', { targetUrl: to?.url.pathname }));
      clearSession();
      goto(resolve(appPath(loginRedirectPath(to?.url ?? { pathname: '/', search: '' }))));
    }
  });
</script>

{@render children?.()}

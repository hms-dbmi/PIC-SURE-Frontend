<script lang="ts">
  import type { Snippet } from 'svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import { clearSession, isTokenExpired } from '$lib/stores/User';
  import { log, createLog } from '$lib/logger';

  let { children }: { children?: Snippet } = $props();

  // The +layout.ts load function checks token expiry on initial navigation, but SvelteKit
  // won't re-run it when navigating to the same URL (e.g. clicking "Explorer" while already
  // on /explorer). beforeNavigate fires on every navigation attempt, catching that gap.
  beforeNavigate(({ to, cancel }) => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      cancel();
      log(createLog('AUTH', 'auth.redirect_token_expired', { targetUrl: to?.url.pathname }));
      clearSession();
      goto(`/login?redirectTo=${encodeURIComponent(to?.url.pathname || '/')}`);
    }
  });
</script>

{@render children?.()}

<script lang="ts">
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/api/paths.ts';
  import type { Snippet } from 'svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import { session } from '#lib/auth/session.svelte.ts';
  import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';

  let { children }: { children?: Snippet } = $props();

  // The guards check token expiry when a load runs, but SvelteKit doesn't re-run them when
  // navigating to the same URL (e.g. clicking "Explorer" while already on /explorer).
  // beforeNavigate fires on every navigation attempt, catching that gap. The login page ends the
  // session and logs it, as it does for the guards.
  beforeNavigate(({ to, cancel }) => {
    if (!to || to.url.origin !== location.origin) return;
    if (to.route.id?.startsWith('/(authentication)/')) return;
    if (session.isLoggedIn && !session.hasValidToken) {
      cancel();
      goto(resolve(appPath(loginRedirectPath(to.url, 'expired'))));
    }
  });
</script>

{@render children?.()}

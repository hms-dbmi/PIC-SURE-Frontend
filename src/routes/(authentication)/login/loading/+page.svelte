<script lang="ts">
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/api/paths.ts';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { config } from '#lib/config/config.svelte.ts';
  import { findLoginProvider } from '#lib/auth/providers/AuthProvider.ts';
  import { createInstance } from '#lib/auth/providerRegistry.ts';
  import { LoginStateError } from '#lib/auth/loginState.ts';
  import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
  import { panelOpen } from '#lib/explorer/panel.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import type { User } from '#lib/auth/model/user.ts';
  import { asksForTerms } from '#lib/auth/access.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  async function attemptUserLogin(redirectTo: string) {
    // Retrives the providers from the server's providerRegistry created via hooks.server.ts
    const provider = findLoginProvider(page.data?.providers);
    // The provider is saved when a login starts, so without it this tab started none.
    if (!provider) throw new LoginStateError('missing');
    const providerType = provider.type;

    const providerInstance = await createInstance(provider);
    let hashParts = page.url.hash?.split('&') || [];
    if (page.url.search.startsWith('?')) {
      hashParts = page.url.search.substring(1).split('&') || [];
    }

    await providerInstance.authenticate(hashParts).then(async (user: User | undefined) => {
      if (!user || !user?.token) {
        throw new Error('User not found');
      }

      // api returns as string
      user.acceptedTOS = String(user.acceptedTOS) === 'true';
      if (asksForTerms(config.features) && !user.acceptedTOS) {
        // PSAMA refuses the profile request until the terms are accepted, so record just this.
        session.setToken(user.token);
        session.user = { acceptedTOS: false };
        log(
          createLog(
            'LOGIN',
            'login.success',
            { provider: providerType },
            {
              status: 200,
              logged_in: true,
              user_id: user.userId ?? user.email,
              user_email: user.email?.includes('@') ? user.email : undefined,
            },
          ),
        );
      } else {
        // So a refusal of the profile request isn't taken for the terms (see `holdForTerms`).
        if (user.acceptedTOS) session.user = { acceptedTOS: true };
        // Load the profile before logging so createLog reads user_id/email/roles from the
        // session; without it the event is logged blank.
        await session.login(user.token);
        log(createLog('LOGIN', 'login.success', { provider: providerType }, { status: 200 }));
      }

      const isAppPath = redirectTo.startsWith('/') && !redirectTo.startsWith('//');
      if (isAppPath) {
        const queryStart = redirectTo.indexOf('?');
        const pathname = queryStart === -1 ? redirectTo : redirectTo.slice(0, queryStart);
        const search = queryStart === -1 ? '' : redirectTo.slice(queryStart);
        // goto rejects paths that match no route (e.g. a stale redirectTo), so fall back home.
        // The path portion IS resolved; the rule can't model an appended query string.
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        goto(`${resolve(appPath(pathname))}${search}`).catch(() => {
          log(createLog('LOGIN', 'login.redirect_dropped', { path: pathname }));
          return goto(resolve(''));
        });
      } else {
        goto(resolve(''));
      }
    });
  }

  onMount(async () => {
    panelOpen.set(false);
    const redirectTo = sessionStorage.getItem('redirect') || '/';
    attemptUserLogin(redirectTo).catch((error) => {
      if (error instanceof LoginStateError && error.problem === 'missing') {
        log(createLog('LOGIN', 'login.restart'));
        // `redirect` already holds the path and query the login set out from.
        const restart = loginRedirectPath({ pathname: redirectTo, search: '' }, 'login_restart');
        goto(resolve(appPath(restart)));
        return;
      }
      log(createLog('LOGIN', 'login.failure', { error: String(error) }, { status: 401 }));
      console.error('Login Error: ', error);
      goto(resolve('login/error'));
      return;
    });
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  <Loading ring size="large" label="Logging you in" />
</section>

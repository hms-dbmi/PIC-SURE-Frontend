<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { config } from '$lib/configuration.svelte';
  import type AuthProvider from '$lib/models/AuthProvider';
  import { createInstance } from '$lib/AuthProviderRegistry';
  import { browser } from '$app/environment';
  import { panelOpen } from '$lib/stores/SidePanel';
  import Loading from '$lib/components/Loading.svelte';
  import type { User } from '$lib/models/User';
  import { login, setToken } from '$lib/stores/User';
  import { log, createLog } from '$lib/logger';

  async function attemptUserLogin() {
    let redirectTo = '/';
    let providerType: string | undefined | null;
    if (browser) {
      redirectTo = sessionStorage.getItem('redirect') || '/';
      providerType = sessionStorage.getItem('type');
    }

    // Retrives the providers from the server's AuthProviderRegistry created via hooks.server.ts
    const provider = providerType
      ? page.data?.providers.find((p: AuthProvider) => p.type === providerType)
      : undefined;
    if (!provider) {
      throw new Error('Provider not found');
    }

    const providerInstance = await createInstance(provider);
    let hashParts = page.url.hash?.split('&') || [];
    if (page.url.search.startsWith('?')) {
      hashParts = page.url.search.substring(1).split('&') || [];
    }
    if (!hashParts || hashParts.length === 0) {
      return new Error('Provider configuration error');
    }

    await providerInstance.authenticate(hashParts).then(async (user: User | undefined) => {
      if (!user || !user?.token) {
        throw new Error('User not found');
      }

      // api returns as string
      user.acceptedTOS = String(user.acceptedTOS) === 'true';
      if (config.features.enforceTermsOfService && !user.acceptedTOS) {
        setToken(user.token);
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
        // Hydrate the store via login() before logging so createLog reads user_id/email/roles
        // from it; without this the store is empty and the event is logged blank.
        await login(user.token);
        log(createLog('LOGIN', 'login.success', { provider: providerType }, { status: 200 }));
      }

      goto(resolve(redirectTo as '/'));
    });
  }

  onMount(async () => {
    panelOpen.set(false);
    attemptUserLogin().catch((error) => {
      log(createLog('LOGIN', 'login.failure', { error: String(error) }, { status: 401 }));
      console.error('Login Error: ', error);
      goto(resolve('/login/error'));
      return;
    });
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  <Loading ring size="large" label="Logging you in" />
</section>

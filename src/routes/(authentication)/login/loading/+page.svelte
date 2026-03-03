<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { features } from '$lib/configuration';
  import type AuthProvider from '$lib/models/AuthProvider';
  import { createInstance } from '$lib/AuthProviderRegistry';
  import { browser } from '$app/environment';
  import { filters } from '$lib/stores/Filter';
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

    await providerInstance.authenticate(hashParts).then((user: User | undefined) => {
      if (!user || !user?.token) {
        throw new Error('User not found');
      }

      log(createLog('LOGIN', 'login.success', { provider: providerType }));

      // api returns as string
      user.acceptedTOS = String(user.acceptedTOS) === 'true';
      if (features.enforceTermsOfService && !user.acceptedTOS) {
        setToken(user.token);
        goto(redirectTo);
      } else {
        login(user.token).then(() => goto(redirectTo));
      }
    });
  }

  onMount(async () => {
    panelOpen.set(false);
    attemptUserLogin().catch((error) => {
      log(createLog('LOGIN', 'login.failure', { error: String(error) }));
      console.error('Login Error: ', error);
      goto('/login/error');
      return;
    });

    let filtersJson = sessionStorage.getItem('filters');
    if (filtersJson) {
      let storedFilters = JSON.parse(filtersJson || '[]');
      filters.set(storedFilters);
      // wait to delete from session storage, in case loading the filters in the line above triggers the session
      // storage to be re-written
      setTimeout(() => sessionStorage.setItem('filters', '[]'), 500);
    }
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  <Loading ring size="large" label="Logging you in" />
</section>

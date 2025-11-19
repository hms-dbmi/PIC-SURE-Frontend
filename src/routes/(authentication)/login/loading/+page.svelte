<script lang="ts">
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

      // api returns as string
      user.acceptedTOS = String(user.acceptedTOS) === 'true';
      if (config.features.enforceTermsOfService && !user.acceptedTOS) {
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
      console.error('Login Error: ', error);
      goto('/login/error');
      return;
    });
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  <Loading ring size="large" label="Logging you in" />
</section>

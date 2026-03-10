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

  async function attemptUserLogin() {
    console.log(`[Loading] attemptUserLogin: starting`);
    let redirectTo = '/';
    let providerType: string | undefined | null;
    if (browser) {
      redirectTo = sessionStorage.getItem('redirect') || '/';
      providerType = sessionStorage.getItem('type');
      console.log(`[Loading] attemptUserLogin: redirectTo=${redirectTo}, providerType=${providerType}`);
      console.log(`[Loading] attemptUserLogin: sessionStorage idp=${sessionStorage.getItem('idp')}`);
    }

    // Retrives the providers from the server's AuthProviderRegistry created via hooks.server.ts
    const availableProviders = page.data?.providers;
    console.log(`[Loading] attemptUserLogin: available providers=`, availableProviders?.map((p: AuthProvider) => p.type));
    const provider = providerType
      ? availableProviders.find((p: AuthProvider) => p.type === providerType)
      : undefined;
    if (!provider) {
      console.error(`[Loading] attemptUserLogin: Provider not found for type="${providerType}"`);
      throw new Error('Provider not found');
    }
    console.log(`[Loading] attemptUserLogin: found provider type=${provider.type}, name=${provider.name}`);

    const providerInstance = await createInstance(provider);
    console.log(`[Loading] attemptUserLogin: provider instance created, class=${providerInstance.constructor.name}`);
    let hashParts = page.url.hash?.split('&') || [];
    if (page.url.search.startsWith('?')) {
      hashParts = page.url.search.substring(1).split('&') || [];
    }
    console.log(`[Loading] attemptUserLogin: hashParts=`, hashParts);
    console.log(`[Loading] attemptUserLogin: page.url.hash=${page.url.hash}, page.url.search=${page.url.search}`);
    if (!hashParts || hashParts.length === 0) {
      console.error(`[Loading] attemptUserLogin: no hashParts found - Provider configuration error`);
      return new Error('Provider configuration error');
    }

    console.log(`[Loading] attemptUserLogin: calling providerInstance.authenticate()`);
    await providerInstance.authenticate(hashParts).then((user: User | undefined) => {
      console.log(`[Loading] attemptUserLogin: authenticate returned`, {
        hasUser: !!user,
        hasToken: !!user?.token,
        acceptedTOS: user?.acceptedTOS,
      });
      if (!user || !user?.token) {
        console.error(`[Loading] attemptUserLogin: User not found or missing token`, user);
        throw new Error('User not found');
      }

      // api returns as string
      user.acceptedTOS = String(user.acceptedTOS) === 'true';
      if (features.enforceTermsOfService && !user.acceptedTOS) {
        console.log(`[Loading] attemptUserLogin: TOS not accepted, setting token and redirecting to ${redirectTo}`);
        setToken(user.token);
        goto(redirectTo);
      } else {
        console.log(`[Loading] attemptUserLogin: logging in and redirecting to ${redirectTo}`);
        login(user.token).then(() => goto(redirectTo));
      }
    });
  }

  onMount(async () => {
    console.log(`[Loading] onMount: page loaded, URL=${page.url.href}`);
    panelOpen.set(false);
    attemptUserLogin().catch((error) => {
      console.error('[Loading] onMount: Login Error caught - redirecting to /login/error', error);
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

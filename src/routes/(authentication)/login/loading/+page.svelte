<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type AuthProvider from '$lib/models/AuthProvider';
  import { createInstance } from '$lib/AuthProviderRegistry';
  import { browser } from '$app/environment';

  let failed = false;
  onMount(async () => {
    let redirectTo = '/';
    let providerType: string | undefined | null;
    if (browser) {
      redirectTo = sessionStorage.getItem('redirect') || '/';
      providerType = sessionStorage.getItem('type');
    }
    if (!providerType) {
      failed = true;
    }
    redirectTo = !redirectTo ? '/' : redirectTo;
    // Retrives the providers from the server's AuthProviderRegistry created via hooks.server.ts
    const provider = $page.data?.providers.find((p: AuthProvider) => p.type === providerType);
    if (!provider) {
      failed = true;
    }
    const providerInstance = await createInstance(provider);
    let hashParts = $page.url.hash?.split('&') || [];
    if ($page.url.search.startsWith('?')) {
      hashParts = $page.url.search.substring(1).split('&') || [];
    }
    console.log('hashParts', hashParts);
    failed = await providerInstance.authenticate(hashParts);
    goto(failed ? '/login/error' : redirectTo);
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  {#if !failed}
    <h1 class="m-10">Logging you in...</h1>
    <ProgressRadial width="w-20" />
  {/if}
</section>
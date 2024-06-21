<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type AuthProvider from '$lib/models/AuthProvider';
  import { createInstance } from '$lib/AuthProviderRegistry';

  let failed = false;
  onMount(async () => {
    let redirectTo = $page.url.searchParams.get('redirectTo');
    let providerType = $page.url.searchParams.get('provider');
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
    const hashParts = window.location.hash.split('&');
    failed = await providerInstance.authenticate(redirectTo, hashParts);
    goto(failed ? '/login/error' : redirectTo);
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  {#if !failed}
    <h1 class="m-10">Logging you in...</h1>
    <ProgressRadial width="w-20" />
  {/if}
</section>

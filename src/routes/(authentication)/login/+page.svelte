<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import LoginButton from '$lib/components/LoginButton.svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
  let logins: any[] = [];
  onMount(async () => {
    logins = $page.data?.providers || [];
  });
</script>

<section id="logins" class="flex flex-col justify-center items-center w-full h-full">
  {#await $page.data?.providers}
    <ProgressRadial width="w-10" value={undefined} />
  {:then}
    {#each logins as provider}
      <LoginButton buttonText={provider.description || provider.name} {provider} {redirectTo} />
    {/each}
  {/await}
</section>

<style>
</style>

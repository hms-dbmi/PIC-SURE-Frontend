<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import LoginButton from '$lib/components/LoginButton.svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
</script>

<section id="logins" class="flex flex-col justify-center items-center w-full h-full">
  {#await $page.data?.providers}
    <ProgressRadial width="w-10" value={undefined} />
  {:then providers}
    {#if providers.length === 0}
      <p>
        No authentication providers are registed. Please add them to your configuration. Click <a class="anchor"
          href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure"
          target="_blank">Here</a>
          to learn how.
      </p>
    {:else}
      {#each providers as provider}
        <LoginButton buttonText={provider.description || provider.name} {provider} {redirectTo} />
      {/each}
    {/if}
  {/await}
</section>

<style>
</style>

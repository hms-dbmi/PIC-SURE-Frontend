<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import LoginButton from '$lib/components/LoginButton.svelte';

  const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
  let logins: any[] = [];
  onMount(async () => {
    console.log('Providers:', $page.data?.providers);
    logins = await Promise.all(
      $page.data?.providers?.map(async (login: any) => {
        console.log('Loading provider:', login);
        const providerModule = await import(`../../../lib/auth/${login.type}.ts`);
        const ProviderClass = providerModule.default;
        const providerInstance = new ProviderClass(login);
        return providerInstance; // Return the providerInstance for the new array
      }) || [],
    );
  });
</script>

<section id="logins" class="flex flex-col justify-center items-center w-full h-full">
  {#if $page.data?.providers}
    {#each logins as provider}
      <LoginButton
        buttonText={provider.description || provider.name}
        loginFunction={provider.login}
        {redirectTo}
      />
    {/each}
  {/if}
  <!-- <button id="login-button" on:click={login} class="btn variant-filled-primary">Log In</button> -->
</section>

<style>
</style>

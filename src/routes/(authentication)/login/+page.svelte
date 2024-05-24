<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
    import type { AuthData, AuthProviderConstructor } from '$lib/models/AuthProvider';
    import type AuthProvider from '$lib/models/AuthProvider';
  import { onMount } from 'svelte';
  import LoginButton from '$lib/components/LoginButton.svelte';
  
  const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
  let logins: AuthProvider[] = [];
  onMount(async () => {
    logins = await Promise.all(
    $page.data?.providers?.map(async (login: AuthData) => {
      const providerModule = await import(`../../../lib/auth/${login.name}.ts`);
      const ProviderClass = providerModule.default as AuthProviderConstructor;
      const providerInstance = new ProviderClass() as AuthProvider;
      Object.assign(providerInstance, login);
      return providerInstance; // Return the providerInstance for the new array
    }) || []
  );
  });
</script>

<section id="logins" class="flex flex-col justify-center items-center w-full h-full">
  {#if $page.data?.providers}
    {#each logins as provider}
      <LoginButton buttonText={provider.description || provider.name} loginFunction={provider.login} redirectTo={redirectTo}/>
    {/each}
  {/if}
  <!-- <button id="login-button" on:click={login} class="btn variant-filled-primary">Log In</button> -->
</section>

<style>
</style>

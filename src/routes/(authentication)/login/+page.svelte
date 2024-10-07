<script lang="ts">
  import { page } from '$app/stores';
  import LoginButton from '$lib/components/LoginButton.svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import Logo from '$lib/components/Logo.svelte';
  import type { AuthData } from '$lib/models/AuthProvider';
  import { branding, features } from '$lib/configuration';
  import { fly } from 'svelte/transition';

  const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
  const siteName = branding?.applicationName;
  const description = branding?.login.description;
  const openPicsureLinkText = branding?.login.openPicsureLinkText;

  let selected: string;

  $: selectedProvider = selected
    ? ($page.data?.providers?.find((provider: AuthData) => provider.name === selected) as AuthData)
    : undefined;
</script>

<section
  id="logins"
  class="flex flex-col items-center h-screen w-full text-center place-content-center text-lg"
  in:fly={{ duration: 600, x: '100%' }}
>
  <div id="title-box" class="flex flex-col items-center text-center mb-8">
    <h1 data-testid="login-title" class="mb-6 w-full flex gap-2 items-center justify-center">
      <Logo class="flex-none" height={4} />
    </h1>
    <p data-testid="login-description" class="max-w-16 text-2xl">{description}</p>
  </div>
  {#await $page.data?.providers}
    <ProgressRadial width="w-10" value={undefined} />
  {:then providers}
    <div id="login-box" class="w-max mt-2">
      <header class="flex flex-col items-center">
        {#if branding?.login?.showSiteName}
          <div>{siteName}</div>
        {/if}
      </header>
      <div class="flex flex-col items-center justify-center">
        <div id="main-logins" class="grid grid-cols-1 gap-4 w-full">
          {#if providers?.length === 0}
            <aside class="auth-warning alert variant-ghost-warning">
              <div class="alert-message">
                No main authentication providers are registered. Please add them to your
                configuration. Click <a
                  class="anchor"
                  href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure"
                  target="_blank">Here</a
                >
                to learn how.
              </div>
            </aside>
          {/if}
          {#if providers.length > 3}
            <select bind:value={selected}>
              {#each providers as provider}
                <option class="capitalize" value={provider.name}
                  >{provider.description || provider.name}</option
                >
              {/each}
            </select>
            {#if selectedProvider}
              <LoginButton
                buttonText="Log In"
                provider={selectedProvider}
                {redirectTo}
                helpText={selectedProvider.helptext}
                class="btn variant-outline-primary m-1 mt-2 w-full"
              />
            {/if}
          {:else}
            {#each providers as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
                class="btn variant-outline-primary text-primary-500 w-full"
              />
            {/each}
          {/if}
        </div>
        {#if features.login.open}
          <a
            href={branding?.login?.openPicsureLink || '/'}
            class="btn variant-outline-primary hover:variant-filled-primary text-primary-500 m-1 mt-2 w-full mb-1"
            >{openPicsureLinkText}</a
          >
        {/if}
        {#await $page.data?.altProviders}
          <ProgressRadial width="w-3" value={undefined} />
        {:then altProviders}
          {#each altProviders as provider}
            <LoginButton
              buttonText={provider.description || provider.name}
              {provider}
              {redirectTo}
              helpText={provider.helptext}
              class="btn variant-outline-tertiary hover:variant-filled-tertiary m-1 w-full last:mb-4"
            />
          {/each}
        {/await}
      </div>
    </div>
  {/await}
</section>

<style>
  .auth-warning {
    width: 239px;
  }
</style>

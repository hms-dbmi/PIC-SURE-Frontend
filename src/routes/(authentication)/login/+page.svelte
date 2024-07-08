<script lang="ts">
  import { page } from '$app/stores';
  import LoginButton from '$lib/components/LoginButton.svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import Logo from '$lib/components/Logo.svelte';
  import type { AuthData } from '$lib/models/AuthProvider';
  import { branding, features } from '$lib/configuration';

  const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
  let selected: string;
  const siteName = branding.applicationName || 'PIC-SURE Demo';
  const title = branding.login.title || 'Welcome to PIC-SURE';
  const description =
    branding.login?.description ||
    'Where searching for, filtering on, and exporting data is made simple.';
  const openPicsureLinkText = branding.login.openPicsureLinkText || 'Explore without Login';
  $: selectedProvider = selected
    ? ($page.data?.providers?.find((provider: AuthData) => provider.name === selected) as AuthData)
    : undefined;
</script>

<section id="logins" class="flex flex-col items-center h-screen text-center">
  <div id="title-box" class="flex flex-col items-center text-center">
    <h1 data-testid="login-title" class="mb-8 text-primary-500-400-token">{title}</h1>
    <p data-testid="login-description" class="max-w-16">{description}</p>
  </div>
  {#await $page.data?.providers}
    <ProgressRadial width="w-10" value={undefined} />
  {:then providers}
    <div id="login-box" class="card !bg-transparent p-6 w-max">
      <header class="card-header flex flex-col items-center">
        <Logo class="" />
        {#if branding.login.showSiteName}
          <div>{siteName}</div>
        {/if}
      </header>
      <div class="card-body flex flex-col items-center justify-center mx-8 mt-6">
        <div id="main-logins" class="flex flex-col items-center w-max">
          {#if providers.length === 0}
            <aside class="auth-warning alert variant-ghost-warning">
              <div class="alert-message">
                No main authentication providers are registed. Please add them to your
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
                class="btn variant-filled-primary m-1 mt-2"
              />
            {/if}
          {:else}
            {#each providers as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
              />
            {/each}
          {/if}
        </div>
        {#if features.login.open}
          <a
            href={branding.login.openPicsureLink || '/'}
            class="btn variant-outline-primary text-primary-500 m-1 mt-2 text-sm"
            >{openPicsureLinkText}</a
          >
        {/if}
        <div id="alt-logins" class="flex flex-col items-center mt-8">
          {#await $page.data?.altProviders}
            <ProgressRadial width="w-3" value={undefined} />
          {:then altProviders}
            {#each altProviders as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
                class="btn variant-ringed-surface text-xs m-1 last:mb-4"
              />
            {/each}
          {/await}
        </div>
      </div>
    </div>
  {/await}
</section>

<style>
  #logins {
    margin-top: 9%;
  }
  #title-box {
    margin-bottom: 3%;
  }
  .auth-warning {
    width: 239px;
  }
</style>

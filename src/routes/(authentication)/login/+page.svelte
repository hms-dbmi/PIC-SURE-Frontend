<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  import { page } from '$app/state';
  import { browser } from '$app/env';

  import { config } from '#lib/config/config.svelte.ts';
  import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';
  import { LOGOUT_REASON_KEY } from '#lib/auth/token.ts';
  import { toaster } from '#lib/ui/toaster.ts';

  import { log, createLog } from '#lib/telemetry/logger.ts';

  import LoginButton from './LoginButton.svelte';
  import Logo from '#lib/shell/Logo.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';

  const redirectTo = page.url.searchParams.get('redirectTo') || '/';
  const siteName = $derived(config.branding.applicationName);
  const description = $derived(config.branding.login.description);
  const openPicsureLinkText = $derived(config.branding.login.openPicsureLinkText);
  let logoutReason: string | null;
  const loading = page.data?.providers;

  onMount(() => {
    if (browser) {
      logoutReason = sessionStorage.getItem(LOGOUT_REASON_KEY);
      if (logoutReason) {
        toaster.error({ title: logoutReason });
        sessionStorage.removeItem(LOGOUT_REASON_KEY);
      }
    }
  });
  let selected: string = $state('');

  let selectedProvider = $derived(
    selected && selected !== ''
      ? (page.data?.providers?.find((provider: AuthData) => provider.name === selected) as AuthData)
      : undefined,
  );
</script>

<section
  id="login-page"
  class="flex h-full w-full flex-col items-center place-content-center text-center text-lg"
  in:fly={{ duration: 600, x: '100%' }}
>
  <div id="login-title" class="flex flex-col items-center text-center mb-8 max-w-3/4">
    <h1 data-testid="login-title" class="mb-6 w-full flex gap-2 items-center justify-center">
      <Logo class="flex-none" height={config.branding.login.logoHeight || 7.5} />
    </h1>
    <p data-testid="login-description" class="text-2xl">{description}</p>
  </div>
  {#await loading}
    <Loading ring size="medium" />
  {:then providers}
    <div id="login-box" class="w-max mt-2">
      <header class="flex flex-col items-center">
        {#if config.branding.login.showSiteName}
          <div>{siteName}</div>
        {/if}
      </header>
      <div class="flex flex-col items-center justify-center">
        <div id="login-providers" class="grid grid-cols-1 gap-4 mb-4 w-full">
          {#if providers?.length === 0}
            <ErrorAlert>
              No main authentication providers are registered. Please add them to your
              configuration. Click <a
                class="anchor"
                href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure"
                target="_blank">Here</a
              >
              to learn how.
            </ErrorAlert>
          {/if}
          {#if providers.length > 3}
            <select id="login-select" bind:value={selected} required>
              <!-- This is a workaround to make the placeholder show when the select is bound to an empty string -->
              <option value="" disabled selected>Select a provider</option>
              {#each providers as provider}
                <option class="capitalize" value={provider.name}
                  >{provider.description || provider.name}</option
                >
              {/each}
            </select>
            <LoginButton
              buttonText="Log In"
              provider={selectedProvider}
              {redirectTo}
              helpText={selectedProvider?.helptext}
              class="w-full"
            />
          {:else}
            {#each providers as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
                class="w-full"
              />
            {/each}
          {/if}
        </div>
        {#if config.features.login.open}
          <Button
            variant="outlined"
            class="mb-4 w-full"
            href={config.branding.login.openPicsureLink || '/'}
            rel="external"
            onclick={() =>
              log(
                createLog('NAVIGATION', 'login.explore_open', {
                  url: config.branding.login.openPicsureLink || '/',
                }),
              )}>{openPicsureLinkText}</Button
          >
        {/if}
        {#await page.data?.altProviders}
          <Loading ring />
        {:then altProviders}
          <div id="login-alt-providers" class="grid grid-cols-1 gap-4 mb-4 w-full">
            {#each altProviders as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
                variant="outlined"
                size="compact"
              />
            {/each}
          </div>
        {/await}
      </div>
    </div>
  {/await}
</section>

<style>
  #login-select:invalid,
  #login-select option[value='']:checked {
    color: var(--color-gray-500);
  }

  #login-select option:not([value='']) {
    color: inherit;
  }
</style>

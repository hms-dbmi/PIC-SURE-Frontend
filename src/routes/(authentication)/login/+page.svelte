<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  import { page } from '$app/state';
  import { browser } from '$app/environment';

  import { branding, features } from '$lib/configuration';
  import type { AuthData } from '$lib/models/AuthProvider';
  import { toaster } from '$lib/toaster';

  import LoginButton from '$lib/components/buttons/LoginButton.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';

  const redirectTo = page.url.searchParams.get('redirectTo') || '/';
  const siteName = branding?.applicationName;
  const description = branding?.login.description;
  const openPicsureLinkText = branding?.login.openPicsureLinkText;
  let logoutReason: string | null;

  onMount(() => {
    if (browser) {
      logoutReason = sessionStorage.getItem('logout-reason');
      if (logoutReason) {
        toaster.error({ title: logoutReason });
        sessionStorage.removeItem('logout-reason');
      }
    }
  });
  let selected: string = $state('');

  let selectedProvider = $derived(
    selected && selected !== ''
      ? (page.data?.providers?.find((provider: AuthData) => provider.name === selected) as AuthData)
      : undefined,
  );
  import Modal from '$lib/components/Modal.svelte';
  import AdvancedFiltering from '$lib/components/explorer/advanced/AdvancedFiltering.svelte';
  import { createCategoricalFilter } from '$lib/models/Filter.svelte';
  import { Operator } from '$lib/models/query/Query';
  import { filterTree } from '$lib/stores/Filter';
  let advancedModalOpen: boolean = $state(false);
  $filterTree.root = $filterTree.createGroup([], Operator.AND);
  const filter1 = createCategoricalFilter(
    {
      conceptPath: 'test',
      dataset: 'test',
      name: 'test',
      display: 'test',
      description: 'test',
      allowFiltering: true,
      studyAcronym: 'test',
      type: 'Categorical',
      children: [],
    },
    ['test', 'test2'],
  );
  const filter2 = createCategoricalFilter(
    {
      conceptPath: 'test2',
      dataset: 'test2',
      name: 'test2',
      display: 'test2',
      description: 'test2',
      allowFiltering: true,
      studyAcronym: 'test2',
      type: 'Categorical',
      children: [],
    },
    ['test3', 'test4'],
  );
  const filter3 = createCategoricalFilter(
    {
      conceptPath: 'test3',
      dataset: 'test3',
      name: 'test3',
      display: 'test3',
      description: 'test3',
      allowFiltering: true,
      studyAcronym: 'test3',
      type: 'Categorical',
      children: [],
    },
    ['test5', 'test6'],
  );
  const filter4 = createCategoricalFilter(
    {
      conceptPath: 'test4',
      dataset: 'test4',
      name: 'test4',
      display: 'test4',
      description: 'test4',
      allowFiltering: true,
      studyAcronym: 'test4',
      type: 'Categorical',
      children: [],
    },
    ['test5', 'test6'],
  );
  const group1 = $filterTree.createGroup([filter3, filter4], Operator.OR);
  const filter5 = createCategoricalFilter(
    {
      conceptPath: 'test5',
      dataset: 'test5',
      name: 'test5',
      display: 'test5',
      description: 'test5',
      allowFiltering: true,
      studyAcronym: 'test5',
      type: 'Categorical',
      children: [],
    },
    ['test7', 'test8'],
  );
  const filter6 = createCategoricalFilter(
    {
      conceptPath: 'test6',
      dataset: 'test6',
      name: 'test6',
      display: 'test6',
      description: 'test6',
      allowFiltering: true,
      studyAcronym: 'test6',
      type: 'Categorical',
      children: [],
    },
    ['test9', 'test10'],
  );
  const group2 = $filterTree.createGroup([filter5, filter6], Operator.AND);
  $filterTree.add(group2);
  $filterTree.add(group1);
  $filterTree.add(filter2);
  $filterTree.add(filter1);
</script>

<Modal
  bind:open={advancedModalOpen}
  title="Advanced Filters"
  withDefault
  width="w-full"
  height="h-full"
  confirmText="Apply Changes"
  onconfirm={() => {
    advancedModalOpen = false;
  }}
>
  <AdvancedFiltering />
</Modal>
<section
  id="logins"
  class="flex flex-col items-center h-screen w-full text-center place-content-center text-lg"
  in:fly={{ duration: 600, x: '100%' }}
>
  <div id="title-box" class="flex flex-col items-center text-center mb-8 max-w-3/4">
    <h1 data-testid="login-title" class="mb-6 w-full flex gap-2 items-center justify-center">
      <Logo class="flex-none" height={7.5} />
    </h1>
    <p data-testid="login-description" class="text-2xl">{description}</p>
  </div>
  {#await page.data?.providers}
    <Loading ring size="medium" />
  {:then providers}
    <div id="login-box" class="w-max mt-2">
      <header class="flex flex-col items-center">
        {#if branding?.login?.showSiteName}
          <div>{siteName}</div>
        {/if}
      </header>
      <div class="flex flex-col items-center justify-center">
        <div id="main-logins" class="grid grid-cols-1 gap-4 mb-4 w-full">
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
              class="btn preset-filled-primary-500 w-full"
            />
          {:else}
            {#each providers as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
                class="btn preset-filled-primary-500 w-full"
              />
            {/each}
          {/if}
        </div>
        {#if features.login.open}
          <a
            href={branding?.login?.openPicsureLink || '/'}
            class="btn preset-outlined-primary-500 text-primary-500 hover:preset-filled-primary-500 hover:text-white mb-4 w-full"
            >{openPicsureLinkText}</a
          >
        {/if}
        {#await page.data?.altProviders}
          <Loading ring />
        {:then altProviders}
          <div id="alt-logins" class="grid grid-cols-1 gap-4 mb-4 w-full">
            {#each altProviders as provider}
              <LoginButton
                buttonText={provider.description || provider.name}
                {provider}
                {redirectTo}
                helpText={provider.helptext}
                class="btn-sm preset-outlined-primary-500 text-primary-500 hover:preset-filled-primary-500 hover:text-white"
              />
            {/each}
          </div>
        {/await}
      </div>
    </div>
  {/await}
  <button class="btn preset-filled-primary-500" onclick={() => (advancedModalOpen = true)}
    >Open Advanced Filters</button
  >
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

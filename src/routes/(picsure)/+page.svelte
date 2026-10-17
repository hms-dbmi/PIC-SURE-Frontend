<script lang="ts">
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/api/paths.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { goto } from '$app/navigation';
  import Searchbox from '#lib/ui/Searchbox.svelte';
  import Stats from './Stats.svelte';
  import { isUserLoggedIn } from '#lib/auth/User.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let searchTerm = $state('');

  function search() {
    log(createLog('SEARCH', 'landing.search', { term: searchTerm }));
    if (config.features.login.open && config.features.discover && !isUserLoggedIn()) {
      goto(resolve(`discover?search=${encodeURIComponent(searchTerm)}`));
    } else {
      goto(resolve(`explorer?search=${encodeURIComponent(searchTerm)}`));
    }
  }

  const actionsToDisplay = $derived(
    config.branding.landing.actions.filter((action) => {
      if (isUserLoggedIn()) {
        return action.showIfLoggedIn;
      } else {
        return action.isOpen || !action.showIfLoggedIn;
      }
    }),
  );
</script>

<svelte:head>
  <title>{config.branding.applicationName}</title>
</svelte:head>

<div
  id="landing-page"
  class="flex flex-wrap flex-col justify-evenly text-center items-center w-full h-full mt-8"
>
  <section id="landing-search" class="flex flex-col text-center items-center my-auto w-2/3">
    <Searchbox placeholder={config.branding.landing.searchPlaceholder} bind:searchTerm {search} />
  </section>
  <section id="landing-actions" class="flex flex-row justify-evenly items-center mb-auto w-2/3">
    {#each actionsToDisplay as { title, description, icon, url, btnText }, i}
      <div class="flex flex-col items-center w-1/{actionsToDisplay?.length || 3}">
        <div class="text-3xl my-1">{title}</div>
        <i class="text-[5rem] my-3 text-secondary-600-400 {icon}"></i>
        <div class="subtitle my-3">{description}</div>
        {#if url.startsWith('/')}
          <a
            data-testid="landing-action-{i}"
            href={resolve(appPath(url))}
            class="btn preset-filled-primary-500"
            onclick={() => log(createLog('NAVIGATION', 'landing.action_click', { title, url }))}
            >{btnText}</a
          >
        {:else}
          <a
            data-testid="landing-action-{i}"
            href={url}
            rel="external"
            class="btn preset-filled-primary-500"
            onclick={() => log(createLog('NAVIGATION', 'landing.action_click', { title, url }))}
            >{btnText}</a
          >
        {/if}
      </div>
    {/each}
  </section>
  <Stats />
</div>

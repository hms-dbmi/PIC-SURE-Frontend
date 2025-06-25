<script lang="ts">
  import { branding } from '$lib/configuration';
  import { goto } from '$app/navigation';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import Stats from '$lib/components/landing/Stats.svelte';
  import { browser } from '$app/environment';
  let searchTerm = $state('');

  const isUserLoggedIn = () => {
    if (browser) {
      return !!localStorage.getItem('token');
    }
    return false;
  };

  function search() {
    isUserLoggedIn()
      ? goto(`/explorer?search=${searchTerm}`)
      : goto(`/discover?search=${searchTerm}`);
  }

  const actionsToDisplay = branding?.landing?.actions.filter((action) => {
    if (isUserLoggedIn()) {
      return action.showIfLoggedIn;
    } else {
      return action.isOpen || !action.showIfLoggedIn;
    }
  });
</script>

<svelte:head>
  <title>{branding.applicationName}</title>
</svelte:head>

<div
  id="landing"
  class="flex flex-wrap flex-col justify-evenly text-center items-center w-full h-full mt-8"
>
  <section id="search-section" class="flex flex-col text-center items-center my-auto w-2/3">
    <Searchbox placeholder={branding?.landing?.searchPlaceholder} bind:searchTerm {search} />
  </section>
  <section id="actions-section" class="flex flex-row justify-evenly items-center mb-auto w-2/3">
    {#each actionsToDisplay as { title, description, icon, url, btnText }}
      <div class="flex flex-col items-center w-1/{actionsToDisplay?.length || 3}">
        <div class="text-3xl my-1">{title}</div>
        <i class="text-[5rem] my-3 text-secondary-600-400 {icon}"></i>
        <div class="subtitle my-3">{description}</div>
        <a data-testid="landing-action-{title}-btn" href={url} class="btn preset-filled-primary-500"
          >{btnText}</a
        >
      </div>
    {/each}
  </section>
  <Stats />
</div>

<script lang="ts">
  import { branding } from '$lib/configuration';
  import { goto } from '$app/navigation';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import Stats from '$lib/components/Stats.svelte';

  let searchTerm = '';

  function search() {
    goto(`/explorer?search=${searchTerm}`);
  }
</script>

<svelte:head>
  <title>{branding.applicationName}</title>
</svelte:head>

<div
  id="landing"
  class="flex flex-wrap flex-row justify-evenly text-center items-center mx-auto mt-10"
>
  <section id="search-section" class="flex flex-col text-center w-full items-center my-4">
    <Searchbox placeholder={branding.landing.searchPlaceholder} bind:searchTerm {search} />
  </section>
  <section class="actions flex flex-row justify-evenly items-center w-full mt-4 mb-8">
    {#each branding.landing.actions as link}
      <a
        href={link.url}
        target={link.url.startsWith('/') ? undefined : '_blank'}
        class="border border-surface-300-600-token rounded-container-token shadow-lg"
        tabindex="0"
      >
        <i class="{link.icon} text-primary-500-400-token" />
        <header class="text-2xl my-2">{link.title}</header>
        <div class="leading-5">{link.description}</div>
      </a>
    {/each}
  </section>
  <Stats />
</div>

<style>
  #landing .actions a {
    color: rgb(var(--text-secondary-500));
    text-decoration: none;
    display: flex;
    flex-direction: column;
    text-align: center;
    max-width: 12.5rem;
    padding: 1rem 0.5rem;
    margin: 0.3rem;
  }

  #landing .actions a:hover,
  #landing .actions a:active {
    transform: scale(1.05);
  }
</style>

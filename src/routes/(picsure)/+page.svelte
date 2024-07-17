<script lang="ts">
  import { branding } from '$lib/configuration';
  import { goto } from '$app/navigation';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import Stats from '$lib/components/Stats.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';

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
  <section class="flex flex-row justify-evenly items-center w-full mt-4 mb-8">
    {#each branding.landing.actions as link}
      <CardButton
        data-testid={link.title}
        href={link.url}
        title={link.title}
        subtitle={link.description}
        icon="{link.icon} text-primary-500-400-token"
      />
    {/each}
  </section>
  <Stats />
</div>

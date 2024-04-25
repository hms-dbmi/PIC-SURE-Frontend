<script lang="ts">
  import { branding } from '$lib/configuration';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import type { Value } from '$lib/models/Value';
  import * as api from '$lib/api';
  import { goto } from '$app/navigation';
  import Searchbox from '$lib/components/Searchbox.svelte';

  let values: Value[];
  let searchTerm = '';

  let getValues = async function () {
    values = await Promise.all(
      branding.landing.stats.map(async (stat) => {
        try {
          if (!stat.valueSrc) {
            return { value: stat.value, title: stat.title };
          }
          const value = await api.get(stat.valueSrc); //TODO: create endpoints
          return { value, title: stat.title } as Value;
        } catch (error) {
          console.error(error);
          return { value: 'N/A', title: stat.title };
        }
      }),
    );
  };

  function search() {
    goto(`/explorer?search=${searchTerm}`);
  }
</script>

<svelte:head>
  <title>{branding.applicationName}</title>
</svelte:head>

<div id="landing" class="landing">
  <section id="search-section" class="flex flex-col text-center items-center search-section">
    <Searchbox placeholder={branding.landing.searchPlaceholder} bind:searchTerm {search} />
    <p>
      {branding.landing.description ||
        'PIC-SURE can be used to search phenotypic variables and genomic variants, apply filters, build cohorts, and export participant-level data.'}
    </p>
  </section>
  <section class="actions">
    {#each branding.landing.actions as link}
      <a href={link.url} target={link.url.startsWith('/') ? undefined : '_blank'} tabindex="0">
        <i class={link.icon} />
        <div>{link.description}</div>
      </a>
    {/each}
  </section>
  <section class="stats">
    {#await getValues()}
      {#each branding.landing.stats as stat}
        <div id="value-{stat.title}" class="flex flex-col justify-center items-center">
          <ProgressRadial width="w-10" value={undefined} />
          <p>{stat.title}</p>
        </div>
      {/each}
    {:then}
      {#each values as stat}
        <div class="flex flex-col">
          <div id="value-{stat.title}" class="flex flex-col justify-center items-center">
            {stat.value}
          </div>
          <p>{stat.title}</p>
        </div>
      {/each}
    {:catch}
      {#each branding.landing.stats as stat}
        <div class="flex flex-col">
          <div id="value-{stat.title}" class="flex flex-col justify-center items-center">N/A</div>
          <p>{stat.title}</p>
        </div>
      {/each}
    {/await}
  </section>
</div>

<style>
  #landing {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 2rem;
    text-align: center;
  }

  #landing #search-section p {
    max-width: 50rem;
    margin: 1rem 0;
  }

  #landing section#search-section {
    width: 70%;
  }

  #landing .actions {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    margin: 2rem 0;
  }

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

  #landing .actions a i {
    color: rgb(var(--color-primary-500));
  }

  #landing .actions a:hover,
  #landing .actions a:active {
    transform: scale(1.05);
  }
  #landing .stats .stat {
    max-width: 10rem;
  }

  #landing .stats div {
    font-size: 1.5rem;
  }

  #landing .stats p {
    font-size: 1rem;
  }
</style>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import { branding, features } from '$lib/configuration';

  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import AddFilterComponent from '$lib/components/explorer/AddFilter.svelte';
  import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
  import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';

  import SearchStore from '$lib/stores/Search';
  import { setComponentRegistry } from '$lib/stores/ExpandableRow';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import type { DictionaryConceptResult } from '$lib/models/api/DictionaryResponses';
  import type { Unsubscriber } from 'svelte/store';
  let { searchTerm, searchResults, search, selectedFacets } = SearchStore;

  let unsubSelectedFacets: Unsubscriber;
  let searchInput = $page.url.searchParams.get('search') || $searchTerm || '';
  let searchPromise: Promise<DictionaryConceptResult | undefined> = search(searchInput).catch(
    (e) => {
      console.error('Error searching for dictionary concepts', e);
      return undefined;
    },
  );
  let resultsPage = 0;
  let pageSize = 10;

  const columns = [
    { dataElement: 'display', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'id', label: 'Actions', class: 'w-36' },
  ];

  const cellOverides = {
    id: Actions,
  };

  const tableName = 'ExplorerTable';
  onMount(() => {
    setComponentRegistry(
      {
        filter: AddFilterComponent,
        info: ResultInfoComponent,
        hierarchy: HierarchyComponent,
      },
      'info',
      tableName,
    );

    unsubSelectedFacets = selectedFacets.subscribe(() => {
      searchPromise = search(searchInput, resultsPage, pageSize);
    });

    return () => {
      setComponentRegistry({});
    };
  });

  function updateSearch() {
    goto(searchInput ? `/explorer?search=${searchInput}` : '/explorer', { replaceState: true });
    searchPromise = search(searchInput, resultsPage, pageSize);
  }
  onDestroy(() => {
    unsubSelectedFacets && unsubSelectedFacets();
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>
<Content full>
  <section id="search-container" class="grid grid-cols-4 gap-6">
    <FacetSideBar />
    <div id="search-results-col" class="col-span-3">
      <div id="search-bar" class="flex gap-2 mb-6">
        <div class="flex-auto">
          <Searchbox bind:searchTerm={searchInput} search={updateSearch} />
        </div>
        <div class="flex-none">
          {#if features.genomicFilter}
            <a
              data-testid="genomic-filter-btn"
              class="btn variant-ghost-primary hover:variant-filled-primary"
              href="/explorer/genome-filter">Genomic Filtering</a
            >
          {/if}
          <button
            type="button"
            class="btn variant-ghost-error hover:variant-filled-error"
            aria-label="You are on the reset button"
            disabled={!searchInput && $selectedFacets.length === 0}
            on:click={() => {
              searchInput = '';
              searchTerm.set('');
              searchResults.set([]);
              selectedFacets.set([]);
              goto('/explorer');
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <div>
        {#await searchPromise}
          <ProgressRadial />
        {:then}
          <Datatable {tableName} data={$searchResults} {columns} {cellOverides} />
        {:catch}
          <ErrorAlert title="API Error">
            <p>Something went wrong when sending your request.</p>
          </ErrorAlert>
        {/await}
      </div>
    </div>
  </section>
</Content>

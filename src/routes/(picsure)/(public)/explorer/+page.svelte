<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { DataHandler, type State } from '@vincjo/datatables/remote';
  import type { Unsubscriber } from 'svelte/store';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import type { Column } from '$lib/models/Tables';
  import type { SearchResult } from '$lib/models/Search';
  import { branding, features } from '$lib/configuration';
  import SearchStore from '$lib/stores/Search';

  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import Content from '$lib/components/Content.svelte';
  import SearchDatatable from '$lib/components/datatable/RemoteTable.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExplorerTour from '$lib/components/tour/ExplorerTour.svelte';

  let { searchTerm, search, selectedFacets, error } = SearchStore;
  let searchInput = $page.url.searchParams.get('search') || $searchTerm || '';
  const tableName = 'ExplorerTable';

  const columns: Column[] = [
    { dataElement: 'display', label: 'Variable Name', sort: false },
    { dataElement: 'description', label: 'Variable Description', sort: false },
    { dataElement: 'id', label: 'Actions', class: 'w-36' },
  ];
  const cellOverides = {
    id: Actions,
  };

  const handler = new DataHandler([] as SearchResult[], { rowsPerPage: 5 });
  handler.onChange((state: State) => search($searchTerm, $selectedFacets, state));

  let unsubSelectedFacets: Unsubscriber;
  let unsubSearchTerm: Unsubscriber;

  onMount(() => {
    unsubSelectedFacets = selectedFacets.subscribe(() => {
      handler.invalidate();
    });

    unsubSearchTerm = searchTerm.subscribe(() => {
      if ($searchTerm) {
        handler.invalidate();
      }
    });

    if (searchInput) {
      searchTerm.set(searchInput);
    }
  });

  function updateSearch() {
    if ($error) {
      error.set('');
      searchTerm.set('');
    }
    searchTerm.set(searchInput);
    goto(searchInput ? `/explorer?search=${searchInput}` : '/explorer', { replaceState: true });
  }

  onDestroy(() => {
    unsubSelectedFacets && unsubSelectedFacets();
    unsubSearchTerm && unsubSearchTerm();
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
              error.set('');
              selectedFacets.set([]);
              goto('/explorer');
            }}
          >
            Reset
          </button>
        </div>
      </div>
      {#if $error}
        <ErrorAlert title="API Error">
          <p>{$error}</p>
        </ErrorAlert>
      {:else}
        <SearchDatatable {tableName} {handler} {columns} {cellOverides} />
      {/if}
      {#if features.explorer.enableTour}
        <div id="explorer-tour" class="text-center">
          <ExplorerTour />
        </div>
      {/if}
    </div>
  </section>
</Content>

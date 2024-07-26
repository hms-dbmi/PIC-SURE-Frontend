<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { DataHandler, type State } from '@vincjo/datatables/remote';
  import type { Unsubscriber } from 'svelte/store';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { Column } from '$lib/models/Tables';
  import type { SearchResult } from '$lib/models/Search';
  import { branding, features } from '$lib/configuration';

  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import Content from '$lib/components/Content.svelte';
  import SearchDatatable from '$lib/components/datatable/RemoteTable.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import SearchStore from '$lib/stores/Search';

  let { searchTerm, search, selectedFacets, error } = SearchStore;
  let searchInput = $page.url.searchParams.get('search') || $searchTerm || '';
  const tableName = 'ExplorerTable';
  let errorMsg = '';

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
  let unsubError: Unsubscriber;

  onMount(() => {
    unsubSelectedFacets = selectedFacets.subscribe(() => {
      handler.invalidate();
    });

    unsubSearchTerm = searchTerm.subscribe(() => {
      if ($searchTerm) {
        handler.invalidate();
      }
    });

    unsubError = error.subscribe(() => {
      errorMsg = $error;
    });

    if (searchInput) {
      searchTerm.set(searchInput);
    }
  });

  function updateSearch() {
    errorMsg = '';
    error.set('');
    searchTerm.set(searchInput);
    goto(searchInput ? `/explorer?search=${searchInput}` : '/explorer', { replaceState: true });
  }

  onDestroy(() => {
    unsubSelectedFacets && unsubSelectedFacets();
    unsubSearchTerm && unsubSearchTerm();
    unsubError && unsubError();
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
      {#if errorMsg}
        <ErrorAlert title="API Error">
          <p>{errorMsg}</p>
        </ErrorAlert>
      {:else}
        <SearchDatatable {tableName} {handler} {columns} {cellOverides} />
      {/if}
    </div>
  </section>
</Content>

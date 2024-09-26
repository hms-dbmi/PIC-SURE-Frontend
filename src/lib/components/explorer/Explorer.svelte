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
  import SearchDatatable from '$lib/components/datatable/RemoteTable.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExplorerTour from '$lib/components/tour/ExplorerTour.svelte';
  /* eslint-disable @typescript-eslint/no-explicit-any */
  export let tourConfig: any;
  
  let { searchTerm, search, selectedFacets, error } = SearchStore;
  let searchInput = $page.url.searchParams.get('search') || $searchTerm || '';
  const tableName = 'ExplorerTable';
  $: tourEnabled = true;
  $: isOpenAccess = $page.url.pathname.includes('/discover');
  
  const additionalColumns = branding.explorePage.additionalColumns || [];

  const columns: Column[] = [
    ...additionalColumns,
    { dataElement: 'display', label: 'Variable Name', sort: false },
    { dataElement: 'description', label: 'Variable Description', sort: false },
    { dataElement: 'id', label: 'Actions', class: 'w-36 text-center' },
  ];
  const cellOverides = {
    id: Actions,
  };

  const handler = new DataHandler([] as SearchResult[], { rowsPerPage: 10 });
  handler.onChange((state: State) => {
    doDisableTour();
    return search($searchTerm, $selectedFacets, state);
  });

  let unsubSelectedFacets: Unsubscriber;
  let unsubSearchTerm: Unsubscriber;

  onMount(() => {
    unsubSelectedFacets = selectedFacets.subscribe(() => {
      handler.invalidate();
    });

    unsubSearchTerm = searchTerm.subscribe(() => {
      if ($searchTerm) {
        handler.setPage(1);
        handler.invalidate();
      }
    });

    if (searchInput) {
      searchTerm.set(searchInput);
    }
  });

  function doDisableTour() {
    if (tourEnabled && (searchInput || ($selectedFacets && $selectedFacets.length > 0))) {
      tourEnabled = false;
    }
  }

  function updateSearch() {
    if ($error) {
      error.set('');
      searchTerm.set('');
    }
    searchTerm.set(searchInput);
    const path = isOpenAccess ? '/discover' : '/explorer';
    goto(searchInput ? `${path}?search=${searchInput}` : `${path}`, { replaceState: true });
  }

  onDestroy(() => {
    unsubSelectedFacets && unsubSelectedFacets();
    unsubSearchTerm && unsubSearchTerm();
  });
</script>

<section id="search-container" class="flex gap-9">
  <div id="facet-side-bar" class="flex-none flex-col items-center w-64">
    <FacetSideBar />
  </div>
  <div id="search-results-col" class="flex-auto">
    <div id="search-bar" class="flex gap-2 mb-6">
      <div class="flex-auto">
        <Searchbox bind:searchTerm={searchInput} search={updateSearch} />
      </div>
      <div class="flex-none">
        {#if !isOpenAccess && features.genomicFilter && (features.explorer.enableGENEQuery || features.explorer.enableSNPQuery)}
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
            tourEnabled = true;
            goto(isOpenAccess ? '/discover' : '/explorer');
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
    {:else if $searchTerm || $selectedFacets.length > 0}
      <SearchDatatable {tableName} {handler} {columns} {cellOverides} />
    {/if}
    {#if features.explorer.enableTour && tourEnabled}
      <div id="explorer-tour" class="text-center mt-4">
        <ExplorerTour {tourConfig} />
      </div>
    {/if}
  </div>
</section>

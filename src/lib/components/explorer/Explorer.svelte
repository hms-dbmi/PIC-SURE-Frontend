<script lang="ts">
  import { onMount } from 'svelte';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import { branding, features } from '$lib/configuration';
  import type { Column } from '$lib/models/Tables';
  import {
    searchTerm,
    selectedFacets,
    tableHandler as handler,
    error,
    tour,
    resetSearch,
    loading as isLoading,
  } from '$lib/stores/Search';

  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import SearchDatatable from '$lib/components/datatable/RemoteTable.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExplorerTour from '$lib/components/tour/ExplorerTour.svelte';
  /* eslint-disable @typescript-eslint/no-explicit-any */
  export let tourConfig: any;

  let searchInput = $page.url.searchParams.get('search') || $searchTerm || '';
  const tableName = 'ExplorerTable';
  const tableColumns = branding.explorePage.columns || [];
  const columns: Column[] = [
    ...tableColumns,
    { dataElement: 'id', label: 'Actions', class: 'w-36 text-center' },
  ];
  const cellOverides = { id: Actions };

  $: isOpenAccess = $page.url.pathname.includes('/discover');
  $: path = isOpenAccess ? '/discover' : '/explorer';

  function update() {
    if ($error) error.set('');
    searchTerm.set(searchInput);

    goto(searchInput ? `${path}?search=${searchInput}` : `${path}`, { replaceState: true });
  }

  function reset() {
    resetSearch();
    searchInput = '';

    goto(path);
  }

  onMount(() => {
    if (searchInput && searchInput !== $searchTerm) {
      searchTerm.set(searchInput);
    } else {
      // reload table and facets
      handler.invalidate();
    }
  });
</script>

<section id="search-container" class="flex gap-9">
  <div id="facet-side-bar" class="flex-none flex-col items-center w-64">
    <FacetSideBar />
  </div>
  <div id="search-results-col" class="flex-auto">
    <div id="search-bar" class="flex gap-2 mb-6">
      <div class="flex-auto">
        <Searchbox bind:searchTerm={searchInput} search={update} />
      </div>
      <div class="flex-none">
        {#if !isOpenAccess && (features.enableGENEQuery || features.enableSNPQuery)}
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
          on:click={reset}
        >
          Reset
        </button>
      </div>
    </div>
    {#if $error}
      <ErrorAlert title="Sorry, we could not retrieve your search results." color="secondary">
        <p>{$error}</p>
      </ErrorAlert>
    {:else if $searchTerm || $selectedFacets.length > 0}
      <SearchDatatable {tableName} {handler} {columns} {cellOverides} {isLoading} />
    {/if}
    {#if features.explorer.enableTour && tour}
      <div id="explorer-tour" class="text-center mt-4">
        <ExplorerTour {tourConfig} />
      </div>
    {/if}
  </div>
</section>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount, untrack } from 'svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { config } from '$lib/configuration.svelte';
  import type { Column } from '$lib/components/datatable/types';
  import {
    searchTerm,
    selectedFacets,
    tableHandler as handler,
    error,
    tour,
    resetSearch,
    loading as isLoading,
  } from '$lib/stores/Search';
  import type { TourDataType } from '$lib/models/Tour';

  import Actions from '$lib/components/explorer/cell/Actions.svelte';
  import SearchDatatable from '$lib/components/datatable/RemoteTable.svelte';
  import Searchbox from '$lib/components/Searchbox.svelte';
  import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExplorerTour from '$lib/components/tour/ExplorerTour.svelte';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  let searchInput = $state(page.url.searchParams.get('search') || $searchTerm || '');

  // The box holds typing the user has not submitted, so it cannot be derived from the store -
  // but it has to follow the store whenever something else moves it, or the box and the rows
  // below it end up showing different searches. The layout applies ?search= on navigations
  // this component does not remount for, which is when that happens.
  let boxTerm = $state($searchTerm);
  $effect(() => {
    const term = $searchTerm;
    if (untrack(() => boxTerm) === term) return;
    boxTerm = term;
    searchInput = term;
  });

  const tableName = 'ExplorerTable';
  const tableColumns = $derived(config.branding.explorePage.columns || []);
  const columns: Column[] = $derived([
    ...tableColumns,
    { dataElement: 'id', label: 'Actions', class: 'w-36 text-center' },
  ]);
  const cellOverides = { id: Actions };
  let isDiscoverPage = $derived(page.url.pathname.includes('/discover'));
  let path = $derived(isDiscoverPage ? '/discover' : '/explorer');

  function update() {
    if ($error) error.set('');
    searchTerm.set(searchInput);

    goto(
      resolve(
        (searchInput ? `${path}?search=${encodeURIComponent(searchInput)}` : `${path}`) as '/',
      ),
      {
        replaceState: true,
      },
    );
  }

  function reset() {
    resetSearch();
    searchInput = '';

    goto(resolve(path as '/'));
  }

  function scrollToSearchResults() {
    document.getElementById(`${tableName}-table`)?.scrollIntoView({ block: 'start' });
  }

  onMount(() => {
    if (page.url.searchParams.get('startTour') === 'true') {
      const tourBtn = document.querySelector('#explorer-tour-btn');
      if (tourBtn) {
        (tourBtn as HTMLElement).click();
      }
    }
  });
</script>

<section id="search-container" class="flex gap-9">
  <div id="facet-side-bar" class="flex-none flex-col items-center w-80">
    <FacetSideBar />
  </div>
  <div id="search-results-col" class="flex-auto">
    <div id="search-bar" class="flex gap-2 mb-6">
      <div class="flex-auto">
        <Searchbox bind:searchTerm={searchInput} search={update} />
      </div>
      <div class="flex-none">
        <button
          type="button"
          class="btn preset-tonal-error border border-error-500 hover:preset-filled-error-500"
          aria-label="You are on the reset button"
          disabled={!searchInput && $selectedFacets.length === 0}
          onclick={reset}
        >
          Reset
        </button>
      </div>
    </div>
    {#if $error}
      <ErrorAlert title="Sorry, we could not retrieve your search results." color="secondary">
        {$error}
      </ErrorAlert>
    {:else if $searchTerm || $selectedFacets.length > 0}
      <SearchDatatable
        isClickable
        ariaLabel="Search results"
        {tableName}
        {handler}
        {columns}
        {cellOverides}
        isLoading={$isLoading}
        expandable
        rowClickLogAction="search_result.row_click"
        onPageChange={scrollToSearchResults}
      />
    {/if}
    {#if config.features.explorer.enableTour && $tour}
      <div id="explorer-tour" class="text-center mt-4">
        <ExplorerTour {tourConfig} />
      </div>
    {/if}
  </div>
</section>

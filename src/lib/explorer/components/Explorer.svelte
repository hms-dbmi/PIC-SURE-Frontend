<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/api/paths.ts';
  import { onMount, onDestroy, tick } from 'svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { config } from '#lib/config/config.svelte.ts';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import {
    searchTerm,
    selectedFacets,
    tableHandler as handler,
    initHandler,
    error,
    tour,
    resetSearch,
    nextSearchSettled,
    loading as isLoading,
  } from '#lib/explorer/Search.ts';
  import type { TourDataType } from '#lib/explorer/components/tour/types.ts';

  import Actions from '#lib/explorer/components/cell/Actions.svelte';
  import SearchDatatable from '#lib/ui/datatable/RemoteTable.svelte';
  import Searchbox from '#lib/ui/Searchbox.svelte';
  import FacetSideBar from '#lib/explorer/components/facets/FacetSideBar.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ExplorerTour from '#lib/explorer/components/tour/ExplorerTour.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  let searchInput = $state(page.url.searchParams.get('search') || $searchTerm || '');
  const tableName = 'ExplorerTable';
  // The tour's steps select this table and its rows by id.
  const tableId = 'explorer-table';
  const tableColumns = $derived(config.branding.explorePage.columns || []);
  const columns: Column[] = $derived([
    ...tableColumns,
    { dataElement: 'id', label: 'Actions', class: 'w-36 text-center' },
  ]);
  const cellOverides = { id: Actions };
  const genomicFeaturesEnabled = $derived(
    config.features.enableGENEQuery || config.features.enableSNPQuery,
  );
  let isDiscoverPage = $derived(page.url.pathname.includes('/discover'));
  let path = $derived(isDiscoverPage ? '/discover' : '/explorer');
  let allowGenomicFiltering = $derived(genomicFeaturesEnabled && !isDiscoverPage);

  function update() {
    if ($error) error.set('');
    searchTerm.set(searchInput);

    goto(
      resolve(appPath(searchInput ? `${path}?search=${encodeURIComponent(searchInput)}` : path)),
      {
        replace: true,
      },
    );
  }

  function reset() {
    resetSearch();
    searchInput = '';

    goto(resolve(appPath(path)));
  }

  function scrollToSearchResults() {
    document.getElementById(tableId)?.scrollIntoView({ block: 'start' });
  }

  let releaseHandler: (() => void) | undefined;

  onMount(async () => {
    releaseHandler = initHandler();
    if (searchInput && searchInput !== $searchTerm) {
      searchTerm.set(searchInput);
    } else {
      // reload table and facets
      handler.invalidate();
    }
    if (page.url.searchParams.get('startTour') === 'true') {
      // A load with a search term hides the tour, so let the one started above finish first
      await nextSearchSettled();
      tour.set(true);
      await tick();
      const tourBtn = document.querySelector('#explorer-tour-start');
      if (tourBtn) {
        (tourBtn as HTMLElement).click();
      }
    }
  });

  onDestroy(() => releaseHandler?.());
</script>

<section id="explorer-main" class="flex gap-9">
  <div id="explorer-facet-sidebar" class="flex-none flex-col items-center w-80">
    <FacetSideBar />
  </div>
  <div id="explorer-results" class="flex-auto">
    <div id="explorer-search-bar" class="flex gap-2 mb-6">
      <div class="flex-auto">
        <Searchbox bind:searchTerm={searchInput} search={update} />
      </div>
      <div class="flex-none">
        {#if allowGenomicFiltering}
          <Button
            variant="tonal"
            data-testid="explorer-genomic-filter-open"
            href={resolve('explorer/genome-filter')}
            onclick={() => log(createLog('NAVIGATION', 'explorer.genomic_filter_click'))}
            >Genomic Filtering</Button
          >
        {/if}
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
        id={tableId}
        data-testid="explorer-results-table"
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

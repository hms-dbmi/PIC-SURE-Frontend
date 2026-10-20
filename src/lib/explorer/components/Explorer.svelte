<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { onMount, onDestroy, tick } from 'svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { config } from '#lib/config/config.svelte.ts';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import { explorerSearch as search } from '#lib/explorer/search.svelte.ts';
  import type { TourDataType } from '#lib/explorer/components/tour/types.ts';
  import type { SearchResult } from '#lib/explorer/types.ts';
  import type { Indexable } from '#lib/utils/objects.ts';
  import type { Filter } from '#lib/query/filter.svelte.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

  import Actions from '#lib/explorer/components/cell/Actions.svelte';
  import AddFilter from '#lib/explorer/components/AddFilter.svelte';
  import HierarchyComponent from '#lib/explorer/components/HierarchyComponent.svelte';
  import ResultInfoComponent from '#lib/explorer/components/ResultInfoComponent.svelte';
  import SearchDatatable from '#lib/ui/datatable/RemoteTable.svelte';
  import Searchbox from '#lib/ui/Searchbox.svelte';
  import FacetSideBar from '#lib/explorer/components/facets/FacetSideBar.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ExplorerTour from '#lib/explorer/components/tour/ExplorerTour.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { exploreMode } from '#lib/explorer/mode.ts';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  let searchInput = $state(page.url.searchParams.get('search') || search.term);
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
  let isDiscoverPage = $derived(exploreMode() === 'discover');
  let path = $derived(
    isDiscoverPage
      ? resolve('/(picsure)/(public)/discover')
      : resolve('/(picsure)/(public)/explorer'),
  );
  let allowGenomicFiltering = $derived(genomicFeaturesEnabled && !isDiscoverPage);

  function update() {
    search.clearError();
    search.setTerm(searchInput);

    goto(searchInput ? `${path}?search=${encodeURIComponent(searchInput)}` : path, {
      replace: true,
    });
  }

  function reset() {
    search.reset();
    searchInput = '';

    goto(path);
  }

  function showAddedFilter() {
    explorerPanel.closeRow();
    explorerPanel.show();
  }

  function addFilter(filter: Filter) {
    filterState.add(filter);
    filterState.enrich(filter, filter.id, filter.dataset);
    showAddedFilter();
  }

  function addHierarchyFilter(filter: Filter) {
    filterState.add(filter);
    showAddedFilter();
  }

  function scrollToSearchResults() {
    document.getElementById(tableId)?.scrollIntoView({ block: 'start' });
  }

  let releaseHandler: (() => void) | undefined;

  onMount(async () => {
    releaseHandler = search.start();
    if (searchInput && searchInput !== search.term) {
      search.setTerm(searchInput);
    } else {
      // reload table and facets
      search.table.invalidate();
    }
    if (page.url.searchParams.get('startTour') === 'true') {
      // A load with a search term hides the tour, so let the one started above finish first
      await search.nextSettled();
      search.showTour();
      await tick();
      const tourBtn = document.querySelector('#explorer-tour-start');
      if (tourBtn) {
        (tourBtn as HTMLElement).click();
      }
    }
  });

  onDestroy(() => releaseHandler?.());
</script>

{#snippet expandedRow(row: Indexable)}
  {#if explorerPanel.activeView === 'filter'}
    <AddFilter data={row as SearchResult} onadded={addFilter} />
  {:else if explorerPanel.activeView === 'hierarchy'}
    <HierarchyComponent data={row as SearchResult} onadded={addHierarchyFilter} />
  {:else}
    <ResultInfoComponent data={row as SearchResult} />
  {/if}
{/snippet}

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
            href={resolve('/(picsure)/(public)/explorer/genome-filter')}
            onclick={() => log(createLog('NAVIGATION', 'explorer.genomic_filter_click'))}
            >Genomic Filtering</Button
          >
        {/if}
        <Button
          variant="tonal-error"
          aria-label="You are on the reset button"
          disabled={!searchInput && search.selectedFacets.length === 0}
          onclick={reset}
        >
          Reset
        </Button>
      </div>
    </div>
    {#if search.error}
      <ErrorAlert title="Sorry, we could not retrieve your search results." color="secondary">
        {search.error}
      </ErrorAlert>
    {:else if search.hasCriteria}
      <SearchDatatable
        isClickable
        ariaLabel="Search results"
        {tableName}
        id={tableId}
        data-testid="explorer-results-table"
        handler={search.table}
        {columns}
        {cellOverides}
        isLoading={search.loading}
        {expandedRow}
        rowClickLogAction="search_result.row_click"
        onPageChange={scrollToSearchResults}
      />
    {/if}
    {#if config.features.explorer.enableTour && search.tour}
      <div id="explorer-tour" class="text-center mt-4">
        <ExplorerTour {tourConfig} />
      </div>
    {/if}
  </div>
</section>

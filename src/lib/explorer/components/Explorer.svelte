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
  import type { Filter } from '#lib/query/filter.svelte.ts';
  import { saveFilter } from '#lib/explorer/saveFilter.ts';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

  import Actions from '#lib/explorer/components/cell/Actions.svelte';
  import AddFilter from '#lib/explorer/components/AddFilter.svelte';
  import HierarchyComponent from '#lib/explorer/components/HierarchyComponent.svelte';
  import ResultInfoComponent from '#lib/explorer/components/ResultInfoComponent.svelte';
  import DataTable from '#lib/ui/datatable/DataTable.svelte';
  import Searchbox from '#lib/ui/Searchbox.svelte';
  import FacetSideBar from '#lib/explorer/components/facets/FacetSideBar.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ExplorerTour from '#lib/explorer/components/tour/ExplorerTour.svelte';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';
  import { exploreMode } from '#lib/explorer/mode.ts';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  let searchInput = $state(page.url.searchParams.get('search') || search.term);
  const tableName = 'ExplorerTable';
  // The tour's steps select this table and its rows by id.
  const tableId = 'explorer-table';
  const tableColumns = $derived(config.branding.explorePage.columns || []);
  const columns: Column<SearchResult>[] = $derived([
    ...tableColumns,
    { dataElement: 'id', label: 'Actions', class: 'w-36 text-center', cell: actionsCell },
  ]);
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

  // An any-record-of filter keeps the labels of the row it was built from.
  function addAnyRecordOfFilter(filter: Filter) {
    saveFilter(filter, { enrich: false });
  }

  function logRowClick(row: SearchResult) {
    log(
      createLog('ACTION', 'search_result.row_click', {
        variable: row.conceptPath,
        open: !explorerPanel.isExpanded(row.conceptPath),
        pageContext: getPageContext(),
      }),
    );
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

{#snippet actionsCell(row: SearchResult)}
  <Actions {row} />
{/snippet}

{#snippet expandedRow(row: SearchResult)}
  {#if explorerPanel.activeView === 'filter'}
    <AddFilter data={row} onadded={(filter) => saveFilter(filter)} />
  {:else if explorerPanel.activeView === 'hierarchy'}
    <HierarchyComponent data={row} onadded={addAnyRecordOfFilter} />
  {:else}
    <ResultInfoComponent data={row} />
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
      <DataTable
        isClickable
        ariaLabel="Search results"
        {tableName}
        id={tableId}
        data-testid="explorer-results-table"
        handler={search.table}
        {columns}
        isLoading={search.loading}
        rowKey="conceptPath"
        expansion={explorerPanel}
        {expandedRow}
        rowClickHandler={logRowClick}
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

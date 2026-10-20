<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { onMount, onDestroy, tick } from 'svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { config } from '#lib/config/config.svelte.ts';
  import { explorerSearch as search } from '#lib/explorer/search.svelte.ts';
  import type { TourDataType } from '#lib/explorer/components/tour/types.ts';
  import type { SearchResult } from '#lib/explorer/types.ts';
  import type { Filter } from '#lib/query/filter.svelte.ts';
  import { saveFilter } from '#lib/explorer/saveFilter.ts';
  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

  import AddFilter from '#lib/explorer/components/AddFilter.svelte';
  import HierarchyComponent from '#lib/explorer/components/HierarchyComponent.svelte';
  import ResultInfoComponent from '#lib/explorer/components/ResultInfoComponent.svelte';
  import ResultsTable from '#lib/explorer/components/ResultsTable.svelte';
  import Searchbox from '#lib/ui/Searchbox.svelte';
  import FacetSideBar from '#lib/explorer/components/facets/FacetSideBar.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ExplorerTour from '#lib/explorer/components/tour/ExplorerTour.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { exploreMode } from '#lib/explorer/mode.ts';

  let { tourConfig }: { tourConfig: TourDataType } = $props();

  const initialSearch = page.url.searchParams.get('search') || search.term;
  let searchInput = $state(initialSearch);
  const tableColumns = $derived(config.branding.explorePage.columns || []);
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
  // ?startTour=true (the export page's "Learn How") opens the tour's instructions. A first search
  // with criteria hides the tour, so then the tour waits for that search to settle.
  let tourStart: 'none' | 'pending' | 'autostart' = $state(
    page.url.searchParams.get('startTour') !== 'true'
      ? 'none'
      : initialSearch || search.selectedFacets.length > 0 || !search.tour
        ? 'pending'
        : 'autostart',
  );

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

  let releaseHandler: (() => void) | undefined;

  onMount(async () => {
    releaseHandler = search.start();
    if (searchInput && searchInput !== search.term) {
      search.setTerm(searchInput);
    } else {
      // reload table and facets
      search.table.invalidate();
    }
    if (tourStart === 'pending') {
      await search.nextSettled();
      search.showTour();
      tourStart = 'autostart';
    }
    if (tourStart === 'autostart') {
      // Only a tour mounted by now opens itself; one remounted after a later reset doesn't.
      await tick();
      tourStart = 'none';
    }
  });

  onDestroy(() => releaseHandler?.());
</script>

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
      <ResultsTable
        handler={search.table}
        columns={tableColumns}
        isLoading={search.loading}
        {expandedRow}
      />
    {/if}
    {#if config.features.explorer.enableTour && search.tour && tourStart !== 'pending'}
      <div id="explorer-tour" class="text-center mt-4">
        <ExplorerTour {tourConfig} autostart={tourStart === 'autostart'} />
      </div>
    {/if}
  </div>
</section>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { toaster } from '#lib/ui/toaster.ts';
  import { config } from '#lib/config/config.svelte.ts';

  import {
    loadQuerySummaryData,
    estimateQuery,
    type QuerySummaryData,
    type QueryEstimate,
  } from '#lib/query/restore.ts';

  import type { Query } from '#lib/query/query.ts';
  import { QueryVersion } from '#lib/api/picsure/datasets.ts';
  import {
    ENSURE_MAX_DEPTH,
    exportState,
    getConceptDetails,
    mapSearchResultAsExport,
  } from '#lib/explorer/index.ts';
  import { getConceptTree } from '#lib/api/picsure/dictionary.ts';

  import { filterState } from '#lib/query/filters.svelte.ts';

  import FiltersSummary from '#lib/datasets/components/FiltersSummary.svelte';
  import SelectedVariablesSummary from '#lib/datasets/components/SelectedVariablesSummary.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import Popover from '#lib/ui/popover/Popover.svelte';
  import FilterCardPlaceholder from './FilterCardPlaceholder.svelte';
  import SkeletonBar from '#lib/ui/skeleton/SkeletonBar.svelte';
  import Button from '#lib/ui/Button.svelte';
  import { buttonSizes } from '#lib/ui/button.ts';

  interface Props {
    query: Query;
    sourceVersion: QueryVersion;
    name?: string;
  }

  let { query, sourceVersion, name }: Props = $props();

  let modal = $state(false);
  let hasExistingFilters = $derived(filterState.all.length > 0);
  let estimate: QueryEstimate = $derived(estimateQuery(query));
  let queryData: QuerySummaryData = $derived(
    loadQuerySummaryData(query, {
      getConceptDetails,
      getConceptTree: (dataset, conceptPath) =>
        getConceptTree(dataset, ENSURE_MAX_DEPTH, conceptPath),
      bypassConceptLookup: config.settings.dataset.bypassConceptLookup,
    }),
  );

  async function setFilters() {
    modal = false;
    const [exportdata, filterdata, genomicData] = await Promise.all([
      queryData.exports,
      queryData.filterTree,
      queryData.genomicFilters,
    ]);
    exportState.replace(exportdata.map(mapSearchResultAsExport));
    filterState.restore(filterdata, genomicData);
    // Success toasts hide after two seconds; raised before the navigation, it can expire while
    // the explorer renders.
    await goto(resolve('explorer'));
    toaster.success({
      description: `Filters restored for ${name ? name + ' dataset' : 'dataset'}.`,
    });
  }

  let restoreQueryButton = $derived(
    sourceVersion === QueryVersion.V3 ||
      (sourceVersion === QueryVersion.V2 && config.features.restoreV2queries),
  );
</script>

{#await queryData.errors}
  <div class="float-right placeholder animate-pulse {buttonSizes.compact}">Restore Filters</div>
{:then errors}
  {@const hasErrors = errors.length > 0}
  {#if hasErrors}
    {@const plural = errors.length > 1 ? 's' : ''}
    <ErrorAlert title="API Error" color="warning">
      An error occurred while retrieving additional filter information for path{plural}:
      {#if errors.length > 1}
        <ul>
          {#each errors as path}
            <li>{path}</li>
          {/each}
        </ul>
      {:else}
        {errors[0]}
      {/if}
    </ErrorAlert>
  {/if}
  {#if restoreQueryButton && !hasErrors}
    <div class="float-right">
      <ConfirmButton
        label="Restore Filters"
        variant="filled-surface"
        size="sm"
        class="float-right"
        bind:open={modal}
        title="Restore Filters"
        data-testid="dataset-restore-filters"
        confirmLabel="Restore Filters"
        onconfirm={() => setFilters()}
      >
        {#if hasExistingFilters}
          <ErrorAlert icon color="warning">You already have active filters.</ErrorAlert>
        {/if}
        <p>Do you want to set these as your active filters and redirect to Explore?</p>
      </ConfirmButton>
    </div>
  {:else}
    <div class="float-right">
      <Popover data-testid="dataset-restore-popover" triggerTypes={['hover', 'focus']}>
        {#snippet trigger(props)}
          <Button {...props} variant="filled-surface" size="sm" aria-disabled="true"
            >Restore Filters</Button
          >
        {/snippet}
        {#if hasErrors}
          This query can't currently be restored because it has returned errors. Refresh or contact
          an admin.
        {:else}
          Restoring queries made before the OR feature was introduced is not supported.
        {/if}
      </Popover>
    </div>
  {/if}
{/await}

<section data-testid="dataset-filters-container" class={`my-4 query-version-${sourceVersion}`}>
  <h2 class="text-left h4 mb-2 mt-6">Filters Applied</h2>
  {#await Promise.all([queryData.filterTree, queryData.genomicFilters])}
    <FilterCardPlaceholder numCards={estimate.filters} />
  {:then [filterTree, genomicFilters]}
    <FiltersSummary {filterTree} {genomicFilters} />
  {/await}
</section>

<section data-testid="dataset-variables-container" class="my-4">
  <h2 class="text-left h4 mb-2 mt-6">Variables Included in Dataset</h2>
  {#await queryData.exports}
    <div class="grid grid-cols-10 gap-4">
      {#each { length: estimate.exports }}
        <SkeletonBar />
      {/each}
    </div>
  {:then exports}
    <SelectedVariablesSummary {exports} />
  {/await}
</section>

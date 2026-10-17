<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { toaster } from '#lib/ui/toaster.ts';
  import { config } from '#lib/config/config.svelte.ts';

  import {
    loadQuerySummaryData,
    estimateV3,
    type QuerySummaryData,
    type QueryEstimate,
  } from '../../query/restore';

  import { QueryV3 } from '#lib/query/query.ts';
  import { QueryVersion } from '#lib/datasets/dataset.ts';
  import { queryV2ToV3, type QueryV2 } from '#lib/query/v2.ts';

  import { genomicFilters, allFilters, setFilterTree } from '#lib/query/filters.ts';
  import { exports } from '#lib/explorer/export/Export.ts';

  import FiltersSummary from '#lib/datasets/components/FiltersSummary.svelte';
  import SelectedVariablesSummary from '#lib/datasets/components/SelectedVariablesSummary.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import Popover from '#lib/ui/popover/Popover.svelte';
  import FilterCardPlaceholder from './FilterCardPlaceholder.svelte';
  import SkeletonBar from '#lib/ui/skeleton/SkeletonBar.svelte';

  let {
    query,
    version,
    name,
  }: {
    query: QueryV2 | QueryV3;
    version: string;
    name?: string;
  } = $props();

  let modal = $state(false);
  let hasExistingFilters = $derived($allFilters.length > 0);
  let queryV3: QueryV3 = $derived(
    new QueryV3(version === QueryVersion.V2 ? queryV2ToV3(query as QueryV2) : (query as QueryV3)),
  );
  let estimate: QueryEstimate = $derived(estimateV3(queryV3));
  let queryData: QuerySummaryData = $derived(loadQuerySummaryData(queryV3));

  async function setFilters() {
    modal = false;
    const [exportdata, filterdata, genomicData] = await Promise.all([
      queryData.exports,
      queryData.filterTree,
      queryData.genomicFilters,
    ]);
    exports.set(exportdata);
    setFilterTree(filterdata);
    genomicFilters.set(genomicData);
    toaster.success({
      description: `Filters restored for ${name ? name + ' dataset' : 'dataset'}.`,
    });
    goto(resolve('explorer'));
  }

  let restoreQueryButton = $derived(
    version === QueryVersion.V3 ||
      (version === QueryVersion.V2 && config.features.restoreV2queries),
  );
</script>

{#await queryData.errors}
  <div class="float-right placeholder animate-pulse btn-sm">Restore Filters</div>
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
        buttonSize="sm"
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
      <Popover
        triggerDisabled={true}
        data-testid="dataset-restore-popover"
        triggerTypes={['hover']}
        triggerStyle="btn preset-filled-surface-500 btn-sm"
      >
        {#snippet trigger()}Restore Filters{/snippet}
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

<section data-testid="dataset-filters-container" class={`my-4 query-version-${version}`}>
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

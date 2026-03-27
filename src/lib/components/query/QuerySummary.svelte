<script lang="ts">
  import { goto } from '$app/navigation';
  import { toaster } from '$lib/toaster';
  import { features } from '$lib/configuration';

  import {
    loadQuerySummaryData,
    estimateV2,
    estimateV3,
    type QuerySummaryData,
    type QueryEstimate,
  } from './QueryConverters';

  import type { QueryV2, QueryV3 } from '$lib/models/query/Query';
  import { QueryVersion } from '$lib/models/Dataset';

  import { genomicFilters, allFilters, setFilterTree } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import FiltersSummary from '$lib/components/query/FiltersSummary.svelte';
  import SelectedVariablesSummary from '$lib/components/query/SelectedVariablesSummary.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Popover from '$lib/components/Popover.svelte';
  import FilterCardPlaceholder from './FilterCardPlaceholder.svelte';

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
  let estimate: QueryEstimate = $derived(
    version === QueryVersion.V2 ? estimateV2(query as QueryV2) : estimateV3(query as QueryV3),
  );
  let queryData: QuerySummaryData = $derived(loadQuerySummaryData(query, version));

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
    goto('/explorer');
  }

  let restoreQueryButton = $derived(
    version === QueryVersion.V3 || (version === QueryVersion.V2 && features.restoreV2queries),
  );
</script>

{#await queryData.errors}
  <div class="float-right placeholder animate-pulse text-sm btn-sm">Restore Filters</div>
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
      <Modal
        bind:open={modal}
        title="Restore Filters"
        data-testid="restore-filters"
        triggerBase="btn preset-filled-surface-500 float-right btn-sm"
        withDefault
        confirmText="Restore Filters"
        onconfirm={() => setFilters()}
      >
        {#snippet trigger()}Restore Filters{/snippet}
        {#if hasExistingFilters}
          <ErrorAlert icon color="warning">You already have active filters.</ErrorAlert>
        {/if}
        <p>Do you want to set these as your active filters and redirect to Explore?</p>
      </Modal>
    </div>
  {:else}
    <div class="float-right">
      <Popover
        triggerDisabled={true}
        data-testid="restore-popover"
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
      <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
      {#each Array(estimate.exports) as _unused, i}
        <div class="placeholder animate-pulse"></div>
      {/each}
    </div>
  {:then exports}
    <SelectedVariablesSummary {exports} />
  {/await}
</section>

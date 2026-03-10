<script lang="ts">
  import { goto } from '$app/navigation';
  import { toaster } from '$lib/toaster';
  import { features } from '$lib/configuration';

  import {
    pathToSearchResult,
    loadQuerySummaryData,
    type QuerySummaryData,
  } from './QueryConverters';

  import type { ExportInterface } from '$lib/models/Export';
  import type { QueryV2, QueryV3 } from '$lib/models/query/Query';
  import type { SearchResult } from '$lib/models/Search';
  import { QueryVersion } from '$lib/models/Dataset';

  import { genomicFilters, allFilters, setFilterTree } from '$lib/stores/Filter';
  import { mapSearchResultAsExport, exports } from '$lib/stores/Export';

  import FiltersSummary from '$lib/components/query/FiltersSummary.svelte';
  import SelectedVariablesSummary from '$lib/components/query/SelectedVariablesSummary.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Popover from '$lib/components/Popover.svelte';

  let {
    query,
    version,
    uuid,
    name,
  }: {
    query: QueryV2 | QueryV3;
    version: string;
    uuid?: string;
    name?: string;
  } = $props();

  let modal = $state(false);
  let hasExistingFilters = $derived($allFilters.length > 0);
  let loadingFilters: Promise<void> = $state(Promise.resolve());

  async function setFilters(data: QuerySummaryData) {
    modal = false;
    loadingFilters = Promise.all(data.fields.map((field) => pathToSearchResult(field)))
      .then((searchPaths: SearchResult[]) => {
        const exportsList: ExportInterface[] = searchPaths.map(mapSearchResultAsExport);

        exports.set(exportsList);
        setFilterTree(data.filterTree);
        genomicFilters.set(data.genomicFilters);
        toaster.success({
          description: `Filters restored for ${name ? name + ' dataset' : 'dataset'}.`,
        });
        goto('/explorer');
      })
      .catch(() => {
        toaster.error({
          description: 'An error occured while retrieving data for additional fields.',
        });
      });
  }

  let restoreQueryButton = $derived(
    version === QueryVersion.V3 || (version === QueryVersion.V2 && features.restoreV2queries),
  );
</script>

{#await loadQuerySummaryData(query, version)}
  <Loading />
{:then data}
  <section id="detail-filters-container" class={`my-4 query-version-${version}`}>
    {#if restoreQueryButton}
      <div class="float-right">
        <Modal
          bind:open={modal}
          title="Restore Filters"
          triggerBase="btn preset-filled-surface-500 float-right btn-sm"
          withDefault
          confirmText="Restore Filters"
          onconfirm={() => setFilters(data)}
        >
          {#snippet trigger()}
            <button class="float-right">
              {#await loadingFilters}<i class="fa-solid fa-spinner fa-spin"></i>{/await}
              Restore Filters
            </button>
          {/snippet}
          {#if hasExistingFilters}
            <ErrorAlert icon color="warning">You already have active filters.</ErrorAlert>
          {/if}
          <p>Do you want to set these as your active filters and redirect to Explore?</p>
        </Modal>
      </div>
    {:else}
      <div class="float-right">
        <Popover data-testid="resotre-popover" triggerTypes={['hover']}>
          {#snippet trigger()}
            <button disabled class="btn preset-filled-surface-500 btn-sm">Restore Filters</button>
          {/snippet}
          Restoring queries made before the OR feature was introduced is not supported.
        </Popover>
      </div>
    {/if}
    <h2 class="text-left h4 mb-2 mt-6">Filters Applied</h2>
    <FiltersSummary filterTree={data.filterTree} genomicFilters={data.genomicFilters} />
  </section>
  <SelectedVariablesSummary paths={data.fields} />
{:catch}
  <ErrorAlert title="API Error">
    An error occurred while retrieving filter information for {uuid
      ? `saved dataset ${uuid}`
      : 'this saved dataset'}.
  </ErrorAlert>
{/await}

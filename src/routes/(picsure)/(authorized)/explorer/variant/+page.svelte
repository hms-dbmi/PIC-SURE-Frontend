<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { branding, features, settings } from '$lib/configuration';
  import { ExportType } from '$lib/models/Variant';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { toaster } from '$lib/toaster';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';

  import {
    count,
    columns,
    data,
    downloadUrl,
    dataExportType,
    getVariantCount,
    getVariantData,
    variantError,
  } from '$lib/stores/Variants';
  import type { Unsubscriber } from 'svelte/store';
  import { getQueryRequest } from '$lib/utilities/QueryBuilder';
  import Loading from '$lib/components/Loading.svelte';

  let loading: Promise<void> = $state(Promise.resolve());
  let unsubVariantError: Unsubscriber;
  let aggregateCheckbox: boolean = $state(settings.variantExplorer.type === ExportType.Full);
  let queryRequest: QueryRequestInterface;

  async function getData() {
    await getVariantCount(queryRequest);
    if ($count > 0 && $count <= settings.variantExplorer.maxCount) {
      await getVariantData(queryRequest);
    }
  }

  async function aggregateChange() {
    aggregateCheckbox = !aggregateCheckbox;
    dataExportType.set(aggregateCheckbox ? ExportType.Aggregate : ExportType.Full);
    loading = getVariantData(queryRequest);
  }

  onMount(() => {
    queryRequest = getQueryRequest(true);
    if (queryRequest.query.hasFilter()) {
      unsubVariantError = variantError.subscribe((error) => {
        if (error) {
          toaster.error({ title: error });
        }
      });
      loading = getData();
    } else {
      toaster.error({
        title: 'No query provided. Please add a genomic filter to explore variant data.',
      });
      goto('/explorer');
    }
  });
  onDestroy(() => {
    if (unsubVariantError) {
      unsubVariantError();
    }
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Variant Explorer</title>
</svelte:head>

{#if $downloadUrl}
  <div>
    <a
      data-testid="variant-download-btn"
      class="btn preset-tonal-primary border border-primary-500 mt-8 mr-6 float-right"
      href={$downloadUrl}
      download="variantData.tsv">Download Variant{aggregateCheckbox ? ' (Aggregate)' : ''} Data</a
    >
  </div>
{/if}
<Content full backUrl="/explorer" backTitle="Back to Explore">
  {#if features.explorer.variantExplorer}
    <h2 class="text-center clear-both">Variant Explorer</h2>
    {#await loading}
      {#if $count > 0}
        <div data-testid="variant-count" class="flex-none w-full">{$count} variants found</div>
      {/if}
      <Loading />
    {:then}
      {#if $count > settings.variantExplorer.maxCount}
        <ErrorAlert color="warning">
          Too many variants! Found {$count}, but cannot display more than
          {settings.variantExplorer.maxCount} variants.
        </ErrorAlert>
      {:else if $count > 0 && $data.length > 0}
        <Datatable
          tableName="variant-explorer"
          data={$data}
          columns={$columns}
          fullWidth
          searchable
        >
          {#snippet tableActions()}
            <div class="flex-auto flex items-end justify-between">
              {#if $count > 0}
                <div data-testid="variant-count" class="">
                  <p>{$count} variants found</p>
                </div>
              {/if}
              {#if settings.variantExplorer.type === ExportType.Full}
                <div class="">
                  <label class="flex items-center space-x-2">
                    <input
                      class="checkbox"
                      type="checkbox"
                      bind:checked={aggregateCheckbox}
                      onclick={aggregateChange}
                    />
                    <p>Aggregate data</p>
                  </label>
                </div>
              {/if}
            </div>
          {/snippet}
        </Datatable>
      {:else}
        <div data-testid="variant-count" class="flex-none w-full">{$count} variants found</div>
      {/if}
    {:catch error}
      <ErrorAlert title="Error">
        {error || 'An error occured while retrieving variant list.'}
      </ErrorAlert>
    {/await}
  {:else}
    <h3>Variant Explorer</h3>
    <ErrorAlert title="Error">
      Variant explorer feature has not been enabled in this environment. Please contact an admin if
      you have any questions.
    </ErrorAlert>
  {/if}
</Content>

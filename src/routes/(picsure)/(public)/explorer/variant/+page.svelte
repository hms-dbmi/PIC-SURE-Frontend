<script lang="ts">
  import { onMount } from 'svelte';
  import { ProgressBar, getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';
  import { branding, features, settings } from '$lib/configuration';
  import { ExportType } from '$lib/models/Variant';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import FilterStore from '$lib/stores/Filter';
  const { getQueryRequest } = FilterStore;

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';

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

  let loading: Promise<void>;
  let aggregateCheckbox: boolean = settings.variantExplorer.type === ExportType.Full;
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
    queryRequest = getQueryRequest();
    if (queryRequest.query.hasFilter()) {
      variantError.subscribe((error) => {
        if (error) {
          toastStore.trigger({
            message: error,
            background: 'variant-filled-error',
          });
        }
      });
      loading = getData();
    } else {
      toastStore.trigger({
        message: 'No query provided. Please add a genomic filter to explore variant data.',
        background: 'variant-filled-error',
      });
      goto('/explorer');
    }
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Variant Explorer</title>
</svelte:head>

<Content full={true} backUrl="/explorer" backTitle="Back to Cohort builder">
  {#if features.explorer.variantExplorer}
    {#if $downloadUrl}
      <div>
        <a
          data-testid="variant-download-btn"
          class="btn variant-ghost-primary mt-2 float-right"
          href={$downloadUrl}
          download="variantData.tsv"
          >Download Variant{aggregateCheckbox ? ' (Aggregate)' : ''} Data</a
        >
      </div>
    {/if}
    <h2 class="text-center clear-both">Variant Explorer</h2>
    {#await loading}
      {#if $count > 0}
        <div data-testid="variant-count" class="flex-none w-full">{$count} variants found</div>
      {/if}
      <h3 class="text-left">Loading</h3>
      <ProgressBar animIndeterminate="anim-progress-bar" />
    {:then}
      {#if $count > settings.variantExplorer.maxCount}
        <aside class="alert variant-filled-warning">
          <i class="fa-solid fa-triangle-exclamation text-4xl"></i>
          <div class="alert-message">
            <p>
              Too many variants! Found {$count}, but cannot display more than
              {settings.variantExplorer.maxCount} variants.
            </p>
          </div>
        </aside>
        <p></p>
      {:else if $count > 0 && $data.length > 0}
        <Datatable
          tableName="variant-explorer"
          data={$data}
          columns={$columns}
          defaultRowsPerPage={10}
          fullWidth={true}
          search={true}
        >
          <svelte:fragment slot="tableActions">
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
                      on:click={aggregateChange}
                    />
                    <p>Aggregate data</p>
                  </label>
                </div>
              {/if}
            </div>
          </svelte:fragment>
        </Datatable>
      {/if}
    {:catch error}
      <ErrorAlert title="Error">
        <p>{error || 'An error occured while retrieving variant list.'}</p>
      </ErrorAlert>
    {/await}
  {:else}
    <h3>Variant Explorer</h3>
    <ErrorAlert title="Error">
      <p>
        Variant explorer feature has not been enabled in this environment. Please contact an admin
        if you have any questions.
      </p>
    </ErrorAlert>
  {/if}
</Content>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { ProgressBar, getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';
  import { branding, features, settings } from '$lib/configuration';
  import { ExportType } from '$lib/models/Variant';
  import type { QueryRequestInterface } from '$lib/models/api/Request';

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
  import type { Unsubscriber } from 'svelte/store';
  import { getQueryRequest } from '$lib/QueryBuilder';

  let loading: Promise<void> = $state();
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
      class="btn variant-ghost-primary mt-8 mr-6 float-right"
      href={$downloadUrl}
      download="variantData.tsv">Download Variant{aggregateCheckbox ? ' (Aggregate)' : ''} Data</a
    >
  </div>
{/if}
<Content full={true} backUrl="/explorer" backTitle="Back to Explore">
  {#if features.explorer.variantExplorer}
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

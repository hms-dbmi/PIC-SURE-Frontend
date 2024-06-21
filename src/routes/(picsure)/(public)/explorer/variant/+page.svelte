<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding, features, settings } from '$lib/configuration';
  import { ExportType } from '$lib/models/Variant';
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
  } from '$lib/stores/Variants';

  let loading: Promise<void> = getData();
  let aggregateCheckbox: boolean = features.explorer.variantExplorerStatus === ExportType.Full;

  async function getData() {
    const query = getQueryRequest();
    await getVariantCount(query);
    if ($count > 0 && $count <= settings.variantExplorer.maxCount) {
      await getVariantData(query);
    }
  }

  async function aggregateChange() {
    aggregateCheckbox = !aggregateCheckbox;
    dataExportType.set(aggregateCheckbox ? ExportType.Aggregate : ExportType.Full);
    const query = getQueryRequest();
    loading = getVariantData(query);
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Variant Explorer</title>
</svelte:head>

<Content full={true} backUrl="/explorer" backTitle="Back to Cohort builder">
  {#if features.explorer.variantExplorer}
    <h3 data-testid="variant-count">
      Variant Explorer{$count > 0 ? `: ${$count} variants found` : ''}
    </h3>
    {#await loading}
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
        {#if $downloadUrl}
          <a
            data-testid="variant-download-btn"
            class="btn variant-ghost-primary mt-2"
            href={$downloadUrl}
            download="variantData.tsv"
            >Download Variant{aggregateCheckbox ? ' (Aggregate)' : ''} Data</a
          >
        {/if}
        <Datatable
          tableName="variant-explorer"
          data={$data}
          columns={$columns}
          defaultRowsPerPage={10}
          fullWidth={true}
          search={true}
        >
          <svelte:fragment slot="tableActions">
            {#if settings.variantExplorer.type === ExportType.Full}
              <label class="flex items-center space-x-2">
                <input
                  class="checkbox"
                  type="checkbox"
                  bind:checked={aggregateCheckbox}
                  on:click={aggregateChange}
                />
                <p>Aggregate data</p>
              </label>
            {/if}
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

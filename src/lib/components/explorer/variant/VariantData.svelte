<script lang="ts">
  import { settings } from '$lib/configuration';

  import { ExportType } from '$lib/models/Variant';
  import type { VariantData } from '$lib/models/Variant';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';

  let {
    count,
    data = $bindable(),
    exportType = $bindable(),
    onAggregateToggle = () => {},
  }: {
    count: number;
    data?: Promise<VariantData>;
    exportType: ExportType;
    onAggregateToggle: (checked: boolean) => void;
  } = $props();

  let aggregateCheckbox: boolean = $state(exportType === ExportType.Aggregate);

  function aggregateChange() {
    aggregateCheckbox = !aggregateCheckbox;
    onAggregateToggle(aggregateCheckbox);
  }
</script>

{#if data}
  {#await data}
    {#if count > 0}
      <div data-testid="variant-count" class="flex-none w-full">
        {count.toLocaleString()} variants found
      </div>
    {/if}
    <Loading ring size="medium" />
  {:then varData}
    {#if count > settings.variantExplorer.maxCount}
      <ErrorAlert color="warning">
        Too many variants! Found {count.toLocaleString()}, but cannot display more than
        {settings.variantExplorer.maxCount} variants.
      </ErrorAlert>
    {:else if count > 0 && !!varData && varData.rows.length > 0}
      <Datatable
        tableName="variant-explorer"
        data={varData.rows}
        columns={varData.columns}
        fullWidth
        searchable
      >
        {#snippet tableActions()}
          {#if varData.downloadUrl}
            <a
              data-testid="variant-download-btn"
              class="btn btn-sm preset-tonal-primary border border-primary-500"
              href={varData.downloadUrl}
              download="variantData.tsv"
            >
              <i class="fa-solid fa-download"></i>
              Download Variant{aggregateCheckbox ? ' (Aggregate)' : ''} Data
            </a>
          {/if}
          {#if count > 0}
            <div data-testid="variant-count" class="text-left w-full">
              {count.toLocaleString()} variants found
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
        {/snippet}
      </Datatable>
    {:else}
      <div data-testid="variant-count" class="flex-none w-full">
        {count.toLocaleString()} variants found
      </div>
    {/if}
  {:catch}
    <ErrorAlert title="Error">An error occured while retrieving variant list.</ErrorAlert>
  {/await}
{/if}

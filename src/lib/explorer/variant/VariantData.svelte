<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';

  import { ExportType } from '#lib/config/index.ts';
  import type { VariantData } from '#lib/explorer/variant/Variant.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import Datatable from '#lib/ui/datatable/StaticTable.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { buttonClass } from '#lib/ui/button.ts';

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
    log(createLog('ACTION', 'variant.aggregate_toggle', { checked: aggregateCheckbox }));
    onAggregateToggle(aggregateCheckbox);
  }
</script>

{#if data}
  {#await data}
    {#if count > 0}
      <div data-testid="explorer-variant-count" class="flex-none w-full">
        {count.toLocaleString()} variants found
      </div>
    {/if}
    <Loading ring size="medium" />
  {:then varData}
    {#if count > config.settings.variantExplorer.maxCount}
      <ErrorAlert color="warning">
        Too many variants! Found {count.toLocaleString()}, but cannot display more than
        {config.settings.variantExplorer.maxCount} variants.
      </ErrorAlert>
    {:else if count > 0 && !!varData && varData.rows.length > 0}
      <Datatable
        tableName="variant-explorer"
        data-testid="explorer-variant-table"
        id="explorer-variant-table"
        ariaLabel="Variant data"
        data={varData.rows}
        columns={varData.columns}
        fullWidth
        searchable
        searchLogAction="variant.search_table"
      >
        {#snippet tableActions()}
          {#if varData.downloadUrl}
            <a
              data-testid="explorer-variant-download"
              class={buttonClass('tonal-static', 'sm')}
              href={varData.downloadUrl}
              rel="external"
              download="variantData.tsv"
              onclick={() =>
                log(createLog('EXPORT', 'variant.download', { exportType: exportType }))}
            >
              <i class="fa-solid fa-download"></i>
              Download Variant{aggregateCheckbox ? ' (Aggregate)' : ''} Data
            </a>
          {/if}
          {#if count > 0}
            <div data-testid="explorer-variant-count" class="text-left w-full">
              {count.toLocaleString()} variants found
            </div>
          {/if}
          {#if config.settings.variantExplorer.type === ExportType.Full}
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
      <div data-testid="explorer-variant-count" class="flex-none w-full">
        {count.toLocaleString()} variants found
      </div>
    {/if}
  {:catch}
    <ErrorAlert title="Error">An error occured while retrieving variant list.</ErrorAlert>
  {/await}
{/if}

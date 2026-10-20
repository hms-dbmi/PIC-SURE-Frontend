<script lang="ts">
  import Summary from '#lib/explorer/export/Summary.svelte';
  import CardButton from '#lib/ui/CardButton.svelte';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  <div class="flex flex-row justify-center">
    <CardButton
      data-testid="export-type-csv"
      title="Export as Data Frame or CSV"
      subtitle="Export data as a Python or R data frame or a comma-separated values file"
      size="other"
      class="flex-1 max-w-64"
      active={exportState.resultType === 'DATAFRAME'}
      onclick={() => {
        log(createLog('EXPORT', 'export.select_type', { type: 'DATAFRAME' }));
        exportState.setResultType('DATAFRAME');
      }}
    ></CardButton>
    {#if config.features.explorer.enableExportTimeseries}
      <CardButton
        data-testid="export-type-timeseries"
        title="Export as Timeseries"
        subtitle="Export as an R or Python data frame or a comma-separated values file including timestamps"
        size="other"
        class="flex-1 max-w-64"
        active={exportState.resultType === 'DATAFRAME_TIMESERIES'}
        onclick={() => {
          log(createLog('EXPORT', 'export.select_type', { type: 'DATAFRAME_TIMESERIES' }));
          exportState.setResultType('DATAFRAME_TIMESERIES');
        }}
      ></CardButton>
    {/if}
    <CardButton
      data-testid="export-type-pfb"
      title="Export as PFB"
      subtitle="Export data in Portable Format for Biomedical Data file format"
      size="other"
      class="flex-1 max-w-64"
      active={exportState.resultType === 'DATAFRAME_PFB'}
      onclick={() => {
        log(createLog('EXPORT', 'export.select_type', { type: 'DATAFRAME_PFB' }));
        exportState.setResultType('DATAFRAME_PFB');
      }}
    ></CardButton>
  </div>
</section>

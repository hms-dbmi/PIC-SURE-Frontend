<script lang="ts">
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import { getActiveType, setActiveType } from '$lib/ExportStepperManager.svelte';
  import { features } from '$lib/configuration';
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  <div class="flex flex-row justify-center">
    <CardButton
      data-testid="csv-export-option"
      title="Export as Data Frame or CSV"
      subtitle="Export data as a Python or R data frame or a comma-separated values file"
      size="other"
      class="flex-1 max-w-64"
      active={getActiveType() === 'DATAFRAME'}
      onclick={() => setActiveType('DATAFRAME')}
    ></CardButton>
    {#if features.explorer.enableExportTimeseries}
      <CardButton
        data-testid="timeseries-export-option"
        title="Export as Timeseries"
        subtitle="Export as an R or Python data frame or a comma-separated values file including timestamps"
        size="other"
        class="flex-1 max-w-64"
        active={getActiveType() === 'DATAFRAME_TIMESERIES'}
        onclick={() => setActiveType('DATAFRAME_TIMESERIES')}
      ></CardButton>
    {/if}
    <CardButton
      data-testid="pfb-export-option"
      title="Export as PFB"
      subtitle="Export data in Portable Format for Biomedical Data file format"
      size="other"
      class="flex-1 max-w-64"
      active={getActiveType() === 'DATAFRAME_PFB'}
      onclick={() => setActiveType('DATAFRAME_PFB')}
    ></CardButton>
  </div>
</section>

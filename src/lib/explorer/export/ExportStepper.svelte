<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { config } from '#lib/config/config.svelte.ts';
  import type { ExportRowInterface } from '#lib/explorer/export/ExportRow.ts';
  import { ExportStatusError, exportState } from '#lib/explorer/export/export.svelte.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import Stepper from '#lib/ui/stepper/Stepper.svelte';
  import Step from '#lib/ui/stepper/Step.svelte';
  import UserToken from '#lib/auth/components/UserToken.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  // Steps
  import ReviewStep from './ReviewStep.svelte';
  import TreeStep from './TreeStep.svelte';
  import TypeStep from './TypeStep.svelte';
  import SaveDatasetStep from './SaveDatasetStep.svelte';
  import TabbedAnalysisStep from './TabbedAnalysisStep.svelte';
  import PfbExport from './PfbExport.svelte';
  import AnalysisPlatformLinks from './AnalysisPlatformLinks.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { buildRequest, filterConcepts } from '#lib/query/build.ts';

  const { rows = [] }: { rows?: ExportRowInterface[] } = $props();

  let statusPromise: Promise<unknown> = $state(Promise.resolve());
  let saveDatasetPromise: Promise<void> = $state(Promise.resolve());

  const resultType = $derived(exportState.request.query.expectedResultType);
  const isDataFrame = $derived(resultType === 'DATAFRAME' || resultType === 'DATAFRAME_TIMESERIES');
  const showPfbExportStep = $derived(
    resultType === 'DATAFRAME_PFB' && config.features.explorer.enablePfbExport,
  );

  onMount(async () => {
    exportState.setRequest(
      buildRequest(filterState.queryFilters, 'COUNT', (query) => {
        // populate selected export columns from filters
        query.select = [
          ...new Set([...query.select, ...filterConcepts(query, filterState.phenotypic)]),
        ];
        return query;
      }),
    );
    if (!config.features.explorer.enablePfbExport) {
      exportState.setResultType('DATAFRAME');
    }
  });

  function onNextHandler(step: number, stepName: string) {
    log(createLog('EXPORT', 'export.stepper_next', { step, stepName }));
    if (stepName === 'start') {
      saveDatasetPromise = exportState.saveDataset().then(() => {
        statusPromise = exportState.waitForExport();
      });
    }
  }

  function onBackHandler(step: number, stepName: string) {
    log(createLog('EXPORT', 'export.stepper_back', { step, stepName }));
  }

  function onComplete() {
    log(
      createLog('EXPORT', 'export.stepper.complete', {
        datasetId: exportState.datasetId,
        resultType: exportState.resultType,
      }),
    );
    exportState.resetStepper();
    goto(resolve('explorer'));
  }
</script>

<Stepper
  class="w-full h-full m-8"
  oncomplete={onComplete}
  onnext={onNextHandler}
  onback={onBackHandler}
  buttonCompleteLabel="Done"
>
  <Step name="review" locked={exportState.dataLimitExceeded}>
    {#snippet header()}Review Cohort Details:{/snippet}
    <ReviewStep query={exportState.request} {rows} />
  </Step>
  {#if config.features.explorer.showTreeStep}
    <Step name="select-variables" locked={exportState.dataLimitExceeded}>
      {#snippet header()}Finalize Data:{/snippet}
      <TreeStep />
    </Step>
  {/if}
  {#if config.features.explorer.enablePfbExport}
    <Step name="select-type" locked={exportState.resultType === undefined}>
      {#snippet header()}Review and Save Dataset:{/snippet}
      <TypeStep />
    </Step>
  {/if}
  <Step name="save-dataset" locked={!exportState.canSave}>
    {#snippet header()}Save Dataset ID:{/snippet}
    <SaveDatasetStep />
  </Step>
  <Step name="start" locked={exportState.downloadLocked}>
    {#snippet header()}Start Analysis:{/snippet}
    <section class="flex flex-col w-full h-full items-center">
      {#await saveDatasetPromise}
        <Loading ring size="medium" label="Saving" />
      {:then}
        {#await statusPromise}
          <Loading ring size="medium" label="Preparing" />
        {:then}
          {#if isDataFrame}
            <TabbedAnalysisStep />
          {:else if showPfbExportStep}
            <PfbExport />
          {/if}
          {#if isDataFrame && config.features.analyzeApi}
            <div class="flex justify-center">
              <UserToken />
            </div>
          {/if}
          <AnalysisPlatformLinks />
        {:catch e}
          <div class="flex justify-center">
            <ErrorAlert
              title="An error occurred while preparing your dataset. Please try again. If this problem persists, please
            contact an administrator."
            >
              {#if e instanceof ExportStatusError}
                <p>{e.message}</p>
              {/if}
            </ErrorAlert>
            <div class="hidden">{e}</div>
          </div>
        {/await}
      {:catch e}
        <div class="flex justify-center">
          <ErrorAlert
            title="An error occurred while saving your dataset. Please try again. If this problem persists, please
          contact an administrator."
          >
            <!-- createDatasetName refuses an invalid name with a message to show as it is. -->
            {#if typeof e === 'string'}
              <p>{e}</p>
            {/if}
          </ErrorAlert>
          <div class="hidden">{e}</div>
        </div>
      {/await}
    </section>
  </Step>
</Stepper>

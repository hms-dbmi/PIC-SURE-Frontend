<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { config } from '#lib/config/config.svelte.ts';
  import type { ExportRowInterface } from '#lib/explorer/export/ExportRow.ts';
  import { exports } from '#lib/explorer/export/Export.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { resultCountsState } from '#lib/query/counts/resultCounts.svelte.ts';
  import { createDatasetName } from '#lib/api/picsure/datasets.ts';
  import { getQueryStatus } from '#lib/api/picsure/query.ts';
  import { withBackoff } from '#lib/utils/backoff.ts';
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
  import {
    getLockDownload,
    setLockDownload,
    getDatasetId,
    getDatasetNameInput,
    getSaveable,
    getActiveType,
    setActiveType,
    setQueryRequest,
    getQueryRequest,
    resetExportStepperState,
  } from '#lib/explorer/export/ExportStepperManager.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { buildRequest, filterConcepts } from '#lib/query/build.ts';

  const { rows = [] }: { rows?: ExportRowInterface[] } = $props();

  let statusPromise: Promise<unknown> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());
  let saveDatasetPromise: Promise<void> = $state(Promise.resolve());

  const showTabbedAnalysisStep = $derived(
    getQueryRequest().query.expectedResultType === 'DATAFRAME' ||
      getQueryRequest().query.expectedResultType === 'DATAFRAME_TIMESERIES',
  );
  const showPfbExportStep = $derived(
    getQueryRequest().query.expectedResultType === 'DATAFRAME_PFB' &&
      config.features.explorer.enablePfbExport,
  );
  const showUserToken = $derived(
    (getQueryRequest().query.expectedResultType === 'DATAFRAME' ||
      getQueryRequest().query.expectedResultType === 'DATAFRAME_TIMESERIES') &&
      config.features.analyzeApi,
  );

  onMount(async () => {
    setQueryRequest(
      buildRequest(filterState.queryFilters, 'COUNT', (query) => {
        // populate selected export columns from filters
        query.select = [
          ...new Set([...query.select, ...filterConcepts(query, filterState.phenotypic)]),
        ];
        return query;
      }),
    );
    if (!config.features.explorer.enablePfbExport) {
      setActiveType('DATAFRAME');
    }
  });

  async function onNextHandler(_step: number, stepName: string): Promise<void> {
    if (stepName === 'start') {
      if (getDatasetId()) {
        saveDatasetPromise = createDatasetName(
          getDatasetId() ?? '',
          getDatasetNameInput() ?? '',
        ).then(() => {
          statusPromise = checkExportStatus(getDatasetId());
        });
      } else {
        throw new Error('No dataset ID provided');
      }
    }
    return;
  }

  async function checkExportStatus(lastPicsureResultId?: string): Promise<void> {
    const statusId = lastPicsureResultId || getDatasetId();
    if (!statusId) throw new Error('No dataset ID provided');

    return withBackoff(
      async () => {
        const res = await getQueryStatus(statusId, getQueryRequest());

        if (res.status === 'ERROR') {
          setLockDownload(true);
          throw new Error(`Export failed with status: ${res.status}`);
        }

        if (res.status !== 'SUCCESS' && res.status !== 'AVAILABLE') {
          throw new Error(`Export not ready. Status: ${res.status}`);
        }

        setLockDownload(false);
        return;
      },
      15,
      500,
      60000,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (error, _attempt) => {
        return !(
          error instanceof Error && error.message.includes('Export failed with status: ERROR')
        );
      },
    );
  }

  function onComplete() {
    log(
      createLog('EXPORT', 'export.stepper.complete', {
        datasetId: getDatasetId(),
        resultType: getActiveType(),
      }),
    );
    resetExportStepperState();
    goto(resolve('explorer'));
  }

  const MAX_DATA_POINTS_FOR_EXPORT = $derived(config.settings.maxDataPointsForExport || 1000000);
  function dataLimitExceeded(): boolean {
    const extraVariables = filterState.phenotypic
      .filter((filter) => filter.filterType === 'AnyRecordOf')
      .reduce((acc, filter) => acc + filter.concepts.length, 0);
    let participantCount: number =
      typeof resultCountsState.total === 'number'
        ? resultCountsState.total
        : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints: number =
      participantCount + (filterState.phenotypic.length + extraVariables) + $exports.length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }
</script>

<Stepper
  class="w-full h-full m-8"
  oncomplete={onComplete}
  onnext={onNextHandler}
  buttonCompleteLabel="Done"
>
  <Step name="review" locked={dataLimitExceeded()}>
    {#snippet header()}Review Cohort Details:{/snippet}
    <ReviewStep
      query={getQueryRequest()}
      {rows}
      {preparePromise}
      dataLimitExceeded={dataLimitExceeded()}
      maxDataPoints={MAX_DATA_POINTS_FOR_EXPORT}
    />
  </Step>
  {#if config.features.explorer.showTreeStep}
    <Step name="select-variables">
      {#snippet header()}Finalize Data:{/snippet}
      <TreeStep />
    </Step>
  {/if}
  {#if config.features.explorer.enablePfbExport}
    <Step name="select-type" locked={getActiveType() === undefined}>
      {#snippet header()}Review and Save Dataset:{/snippet}
      <TypeStep />
    </Step>
  {/if}
  <Step
    name="save-dataset"
    locked={!getDatasetNameInput() ||
      (getDatasetNameInput()?.length ?? 0) < 2 ||
      !getDatasetId() ||
      !getSaveable()}
  >
    {#snippet header()}Save Dataset ID:{/snippet}
    <SaveDatasetStep />
  </Step>
  <Step name="start" locked={getLockDownload()}>
    {#snippet header()}Start Analysis:{/snippet}
    <section class="flex flex-col w-full h-full items-center">
      {#await saveDatasetPromise}
        <Loading ring size="medium" label="Saving" />
      {:then}
        {#await statusPromise}
          <Loading ring size="medium" label="Preparing" />
        {:then}
          {#if showTabbedAnalysisStep}
            <TabbedAnalysisStep />
          {:else if showPfbExportStep}
            <PfbExport />
          {/if}
          {#if showUserToken}
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
            />
            <div class="hidden">{e}</div>
          </div>
        {/await}
      {:catch e}
        <div class="flex justify-center">
          <ErrorAlert
            title="An error occurred while saving your dataset. Please try again. If this problem persists, please
          contact an administrator."
          >
            {#if String(e).includes('Export not ready')}
              <p>{e}</p>
            {/if}
          </ErrorAlert>
          <div class="hidden">{e}</div>
        </div>
      {/await}
    </section>
  </Step>
</Stepper>

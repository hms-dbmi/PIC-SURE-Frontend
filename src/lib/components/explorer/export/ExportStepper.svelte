<script lang="ts">
  import { resolve } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { config } from '$lib/configuration.svelte';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import type { DataSet } from '$lib/models/Dataset';
  import { exports } from '$lib/stores/Export';
  import { filters } from '$lib/stores/Filter';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { serverErrorMessage } from '$lib/api';
  import { createDatasetName } from '$lib/services/datasets';
  import {
    EXPORT_NOT_READY_MESSAGE,
    EXPORT_PREPARE_FAILED_MESSAGE,
    isExportFailure,
    isSessionEnded,
    statusWaitFailureMessage,
    waitUntilAvailable,
  } from '$lib/services/exportStatus';
  import Stepper from '$lib/components/steppers/horizontal/Stepper.svelte';
  import Step from '$lib/components/steppers/horizontal/Step.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
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
  } from '$lib/ExportStepperManager.svelte';
  import { log, createLog } from '$lib/logger';
  import { getQueryRequestV3, getFilterConcepts } from '$lib/utilities/QueryBuilder';
  import { QueryV3 } from '$lib/models/query/Query';

  const { rows = [] }: { rows?: ExportRowInterface[] } = $props();

  const SAVE_FAILED_MESSAGE =
    'An error occurred while saving your dataset. Please try again. If this problem persists, please contact an administrator.';

  const unmounted = new AbortController();
  onDestroy(() => unmounted.abort());

  let statusPromise: Promise<unknown> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());
  let saveDatasetPromise: Promise<void | DataSet> = $state(Promise.resolve());

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
      getQueryRequestV3('COUNT', (query: QueryV3) => {
        // populate selected export columns from filters
        query.select = [...new Set([...query.select, ...getFilterConcepts(query)])];
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
        ).then((data: DataSet) => {
          statusPromise = checkExportStatus(getDatasetId());
          return data;
        });
      } else {
        throw new Error('No dataset ID provided');
      }
    }
    return;
  }

  async function checkExportStatus(lastPicsureResultId?: string): Promise<void> {
    try {
      await waitUntilAvailable(lastPicsureResultId || getDatasetId(), unmounted.signal);
    } catch (error) {
      if (isExportFailure(error)) {
        setLockDownload(true);
      }
      throw error;
    }
    setLockDownload(false);
  }

  /**
   * Picks the alert title for a failed status wait. This step has always shown the preparation
   * failure when the wait ran out of attempts, and keeps doing so.
   *
   * @param error The value the status wait rejected with.
   * @returns The consent message, the sample message or the preparation failure.
   */
  function prepareFailureTitle(error: unknown): string {
    const message = statusWaitFailureMessage(error);
    return message === EXPORT_NOT_READY_MESSAGE ? EXPORT_PREPARE_FAILED_MESSAGE : message;
  }

  function onComplete() {
    log(
      createLog('EXPORT', 'export.stepper.complete', {
        datasetId: getDatasetId(),
        resultType: getActiveType(),
      }),
    );
    resetExportStepperState();
    goto(resolve('/explorer'));
  }

  const MAX_DATA_POINTS_FOR_EXPORT = $derived(config.settings.maxDataPointsForExport || 1000000);
  function dataLimitExceeded(): boolean {
    const extraVariables = $filters
      .filter((filter) => filter.filterType === 'AnyRecordOf')
      .reduce((acc, filter) => acc + filter.concepts.length, 0);
    let participantCount: number =
      typeof resultCountsState.total === 'number'
        ? resultCountsState.total
        : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints: number =
      participantCount + ($filters.length + extraVariables) + $exports.length;
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
          {#if !isSessionEnded(e)}
            <div class="flex justify-center">
              <ErrorAlert title={prepareFailureTitle(e)} />
              <div class="hidden">{e}</div>
            </div>
          {/if}
        {/await}
      {:catch e}
        <div class="flex justify-center">
          <ErrorAlert title={serverErrorMessage(e) ?? SAVE_FAILED_MESSAGE}>
            {#if typeof e === 'string' && e.includes('Export not ready')}
              <p>{e}</p>
            {/if}
          </ErrorAlert>
          <div class="hidden">{e}</div>
        </div>
      {/await}
    </section>
  </Step>
</Stepper>

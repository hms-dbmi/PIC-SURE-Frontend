<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as api from '$lib/api';
  import { branding, features, settings } from '$lib/configuration';
  import { Picsure } from '$lib/paths';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import type { DataSet } from '$lib/models/Dataset';
  import { exports } from '$lib/stores/Export';
  import { filters } from '$lib/stores/Filter';
  import { totalParticipants } from '$lib/stores/ResultStore';
  import { createDatasetName } from '$lib/services/datasets';
  import { federatedQueryMap } from '$lib/stores/Dataset';
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
  import CommonAreaSaveDatasetStep from './CommonAreaSaveDatasetStep.svelte';
  import TabbedAnalysisStep from './TabbedAnalysisStep.svelte';
  import RedcapStep from './RedcapStep.svelte';
  import PfbExport from './PfbExport.svelte';
  import AnalysisPlatformLinks from './AnalysisPlatformLinks.svelte';
  import { selectedConcepts, addConcept } from '$lib/stores/TreeStepConcepts';
  import {
    getLockDownload,
    setLockDownload,
    getDatasetId,
    getDatasetNameInput,
    getSaveable,
    getActiveType,
    setActiveType,
    getPicsureResultId,
    setPicsureResultId,
    setQueryRequest,
    getQueryRequest,
    resetExportStepperState,
  } from '$lib/ExportStepperManager.svelte';

  interface Props {
    query: QueryRequestInterface;
    rows?: ExportRowInterface[];
  }

  const { query, rows = [] }: Props = $props();

  let statusPromise: Promise<unknown> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());
  let saveDatasetPromise: Promise<void | DataSet> = $state(Promise.resolve());

  const showTabbedAnalysisStep = $derived(
    getQueryRequest().query.expectedResultType === 'DATAFRAME' &&
      !features.explorer.enableRedcapExport,
  );
  const showPfbExportStep = $derived(
    getQueryRequest().query.expectedResultType === 'DATAFRAME_PFB' &&
      features.explorer.enablePfbExport &&
      !features.explorer.enableRedcapExport,
  );
  const showUserToken = $derived(
    getQueryRequest().query.expectedResultType === 'DATAFRAME' &&
      features.analyzeApi &&
      !features.explorer.enableRedcapExport,
  );

  onMount(async () => {
    // Auto select csv export when pfb feature is disabled.
    setQueryRequest(query);
    $federatedQueryMap = {};
    if (!features.explorer.enablePfbExport) {
      setActiveType('DATAFRAME');
    }
  });

  async function onNextHandler(_step: number, stepName: string): Promise<void> {
    const shouldAddConcepts =
      features.explorer.showTreeStep &&
      stepName === (features.federated ? 'save-dataset' : 'select-type');

    if (stepName === 'select-variables') {
      getQueryRequest().query.fields.forEach(addConcept);
    }

    if (shouldAddConcepts) {
      $selectedConcepts.forEach((concept: string) => {
        getQueryRequest().query.addField(concept);
      });
    }
    if (stepName === 'start') {
      if (features.explorer.enableRedcapExport) {
        setLockDownload(false);
      }
      const siteQueryIds = Object.values($federatedQueryMap)
        .map((info) => ({ resourceId: info?.resourceId, name: info?.name, queryId: info?.queryId }))
        .filter((v) => v.queryId);
      if (getDatasetId()) {
        if (!getPicsureResultId()) {
          setPicsureResultId(getDatasetId());
        }
        saveDatasetPromise = createDatasetName(
          getDatasetId() ?? '',
          getDatasetNameInput() ?? '',
          siteQueryIds.length > 0 ? siteQueryIds : undefined,
        ).then((data: DataSet) => {
          if (features.federated) {
            statusPromise = Promise.resolve();
            return data;
          } else {
            statusPromise = checkExportStatus(getPicsureResultId());
          }
          return data;
        });
      } else {
        throw new Error('No dataset ID provided');
      }
    }
    return;
  }

  async function checkExportStatus(lastPicsureResultId?: string) {
    const statusId = lastPicsureResultId || getDatasetId();
    const queryFragment = `/${statusId}/status`;
    return api
      .post(`${Picsure.Query}${queryFragment}`, query)
      .then(
        (res: {
          picsureResultId: string;
          status: string;
          resultMetadata: { picsureQueryId: string };
        }) => {
          if (res.status === 'ERROR') {
            setLockDownload(true);
            return Promise.reject(res.status);
          }
          console.log(res);
          setPicsureResultId(res.resultMetadata.picsureQueryId);
          setLockDownload(false);
        },
      );
  }

  function onComplete() {
    if (features.explorer.enableRedcapExport) {
      window.open(
        'https://redcap.tch.harvard.edu/redcap_edc/surveys/?s=EWYX8X8XX77TTWFR',
        '_blank',
      );
      resetExportStepperState();
      goto('/explorer');
    } else {
      resetExportStepperState();
      goto('/explorer');
    }
  }

  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1000000;
  function dataLimitExceeded(): boolean {
    const extraVariables = $filters
      .filter((filter) => filter.filterType === 'AnyRecordOf')
      .reduce((acc, filter) => acc + filter.concepts.length, 0);
    let participantCount: number =
      typeof $totalParticipants === 'number' ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints: number =
      participantCount + ($filters.length + extraVariables) + $exports.length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }
</script>

<Stepper
  class="w-full h-full m-8"
  oncomplete={onComplete}
  onnext={onNextHandler}
  buttonCompleteLabel={features.explorer.enableRedcapExport ? 'Request Access' : 'Done'}
>
  <Step name="review" locked={dataLimitExceeded()}>
    {#snippet header()}Review Cohort Details:{/snippet}
    <ReviewStep {query} {rows} {preparePromise} dataLimitExceeded={dataLimitExceeded()} />
  </Step>
  {#if features.explorer.showTreeStep}
    <Step name="select-variables">
      {#snippet header()}Finalize Data:{/snippet}
      <TreeStep />
    </Step>
  {/if}
  {#if features.explorer.enablePfbExport && !features.federated}
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
    {#if features.federated}
      <CommonAreaSaveDatasetStep />
    {:else}
      <SaveDatasetStep />
    {/if}
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
          <p class="mt-4">{branding.explorePage.analysisExportText}</p>
          {#if showTabbedAnalysisStep}
            <TabbedAnalysisStep />
          {:else if showPfbExportStep}
            <PfbExport />
          {:else if features.explorer.enableRedcapExport}
            <RedcapStep />
          {/if}
          {#if branding.explorePage.goTo.instructions && branding.explorePage.goTo.instructions.length > 0}
            <p>{branding.explorePage.goTo.instructions}</p>
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
          />
          <div class="hidden">{e}</div>
        </div>
      {/await}
    </section>
  </Step>
</Stepper>

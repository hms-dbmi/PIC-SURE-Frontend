<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as api from '$lib/api';
  import { branding, features, settings } from '$lib/configuration';
  import { Picsure } from '$lib/paths';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import type { DataSet } from '$lib/models/Dataset';
  import { type ExpectedResultType } from '$lib/models/query/Query.ts';
  import { exports } from '$lib/stores/Export';
  import { filters } from '$lib/stores/Filter';
  import { totalParticipants } from '$lib/stores/ResultStore';
  import { createDatasetName } from '$lib/services/datasets';
  import { federatedQueryStatuses } from '$lib/stores/Dataset';
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

  interface Props {
    query: QueryRequestInterface;
    rows?: ExportRowInterface[];
  }

  const { query, rows = [] }: Props = $props();

  let activeType: ExpectedResultType | undefined = $state(undefined);
  let statusPromise: Promise<unknown> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());
  let saveDatasetPromise: Promise<void | DataSet> = $state(Promise.resolve());
  let datasetNameInput: string = $state('');
  let picsureResultId: string = $state('');
  let lockDownload = $state(true);

  let datasetId: string = $state('');
  let processingMessage: string = $state('');

  const showTabbedAnalysisStep = $derived(
    query.query.expectedResultType === 'DATAFRAME' && !features.explorer.enableRedcapExport,
  );
  const showPfbExportStep = $derived(
    query.query.expectedResultType === 'DATAFRAME_PFB' &&
      features.explorer.enablePfbExport &&
      !features.explorer.enableRedcapExport,
  );
  const showUserToken = $derived(
    query.query.expectedResultType === 'DATAFRAME' && !features.explorer.enableRedcapExport,
  );

  onMount(async () => {
    // Auto select csv export when pfb feature is disabled.
    if (!features.explorer.enablePfbExport) {
      activeType = 'DATAFRAME';
    }
    console.log('features.explorer.showTreeStep: ', features.explorer.showTreeStep);
    console.log('features: ', features);
  });

  async function onNextHandler(_step: number, stepName: string): Promise<void> {
    if (stepName === 'start') {
      saveDatasetPromise = createDatasetName(
        datasetId,
        datasetNameInput,
        federatedQueryStatuses ? Object.values(federatedQueryStatuses) : undefined,
      ).then((data: DataSet) => {
        statusPromise = checkExportStatus(picsureResultId);
        return data;
      });
    }
    return;
  }

  async function checkExportStatus(lastPicsureResultId?: string) {
    const statusId = lastPicsureResultId || datasetId;
    const queryFragment = `/${statusId}/status`;
    return api
      .post(`${Picsure.Query}${queryFragment}`, query)
      .then((res: { picsureResultId: string; status: string }) => {
        if (res.status === 'ERROR') {
          lockDownload = true;
          return Promise.reject(res.status);
        }
        picsureResultId = res.picsureResultId;
        lockDownload = false;
      });
  }

  function onComplete() {
    if (features.explorer.enableRedcapExport) {
      window.open(
        'https://redcap.tch.harvard.edu/redcap_edc/surveys/?s=EWYX8X8XX77TTWFR',
        '_blank',
      );
    } else {
      goto('/explorer');
    }
  }

  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1000000;
  function dataLimitExceeded(): boolean {
    let participantCount: number =
      typeof $totalParticipants === 'number' ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints: number = participantCount + $filters.length + $exports.length;
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
  <Step name="select-variables">
    {#snippet header()}Finalize Data:{/snippet}
    <TreeStep {query} />
  </Step>
  {#if features.explorer.enablePfbExport && !features.federated}
    <Step name="select-type" locked={activeType === undefined}>
      {#snippet header()}Review and Save Dataset:{/snippet}
      <TypeStep {activeType} />
    </Step>
  {/if}
  <Step name="save-dataset" locked={!datasetNameInput || datasetNameInput.length < 2 || !datasetId}>
    {#snippet header()}Save Dataset ID:{/snippet}
    {#if features.federated}
      <CommonAreaSaveDatasetStep {query} {datasetId} {datasetNameInput} />
    {:else}
      <SaveDatasetStep {query} {datasetId} {datasetNameInput} {activeType} />
    {/if}
  </Step>
  {#if features.explorer.enableRedcapExport}
    <Step name="redcap-export">
      {#snippet header()}Request Access to Patient Level Data:{/snippet}
      <RedcapStep {datasetId} />
    </Step>
  {:else}
    <Step name="start" locked={lockDownload}>
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
              <TabbedAnalysisStep {query} {datasetId} />
            {:else if features.explorer.enableRedcapExport}
              <RedcapStep {datasetId} />
            {:else if showPfbExportStep}
              <PfbExport {query} {datasetId} />
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
  {/if}
</Stepper>

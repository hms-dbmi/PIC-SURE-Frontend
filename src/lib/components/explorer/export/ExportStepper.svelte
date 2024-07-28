<script lang="ts">
  import * as api from '$lib/api';
  import { browser } from '$app/environment';
  import Stepper from '$lib/components/steppers/horizontal/Stepper.svelte';
  import Step from '$lib/components/steppers/horizontal/Step.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import Summary from './Summary.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExportStore from '$lib/stores/Export';
  let { exports } = ExportStore;
  import { state } from '$lib/stores/Stepper';
  import { goto } from '$app/navigation';
  import type { DataSet } from '$lib/models/Dataset';
  import { createDatasetName } from '$lib/services/datasets';

  export let query: QueryRequestInterface;
  export let showTreeStep = false;
  export let rows: ExportRowInterface[] = [];
  let statusPromise: Promise<string>;
  let preparePromise: Promise<void>;
  let datasetNameInput: string = '';
  let picsureResultId: string = '';
  let lockDownload = true;
  let error: string = '';
  let namedDataset: DataSet;
  // $: participantsCount = 0;
  // $: variablesCount = 0;
  // $: dataPoints = 0;
  $: datasetId = '';
  $: canDownload = true;
  $: apiExport = false;
  const columns = [
    // { dataElement: 'selected', label: 'Selected', sort: true },
    { dataElement: 'variableName', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true },
  ];

  async function onCompleteHandler(): Promise<void> {
    try {
      const res = await api.post(`picsure/query/${datasetId}/result`, {});
      const responseDataUrl = URL.createObjectURL(new Blob([res], { type: 'octet/stream' }));
      if (browser) {
        const link = document.createElement('a');
        link.href = responseDataUrl;
        link.download = 'pic-sure-data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      if (!apiExport) {
        $state.current = 0;
        goto('/dataset/' + namedDataset.uuid);
      }
    } catch (error) {
      console.error('Error in onCompleteHandler', error);
    }
  }
  function onNextHandler(e: CustomEvent): void {
    console.log('event:next', e);
    if (e.detail.step === 0 && !showTreeStep) {
      preparePromise = handleFirstStep();
    }
    if (e.detail.step === 1 && showTreeStep) {
      console.log('event:next', e);
      //TODO: Load tree
    } else if ((e.detail.step === 1 && !showTreeStep) || (showTreeStep && e.detail.step === 2)) {
      createNamedDataset();
    }
    if (e.detail.state.total - 1 === e.detail.step + 1) {
      statusPromise = new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          const status = await checkExportStatus(picsureResultId);
          if (status !== 'PENDING' || status !== 'RUNNING' || status !== 'QUEUED') {
            clearInterval(interval);
            if (status === 'ERROR') {
              lockDownload = true;
              reject(status);
            } else {
              lockDownload = false;
              resolve(status);
            }
          }
        }, 2000);
      });
    }
  }
  function onStepHandler(e: Event): void {
    console.log('event:next', e);
  }
  function onBackHandler(e: Event): void {
    error = '';
    console.log('event:next', e);
  }

  async function handleFirstStep(): Promise<void> {
    try {
      query.query.expectedResultType = 'DATAFRAME';
      query.query.fields = $exports.map((exp) => exp.variableId);
      const res = await api.post('picsure/query', query);
      console.log('res', res);
      datasetId = res.picsureResultId; //todo real res types
    } catch (error) {
      $state.current--;
      console.error('Error in handleFirstStep', error);
      throw error; // Rethrow the error to be consistent with the original function's behavior
    }
  }

  async function createNamedDataset() {
    try {
      const datasetName = encodeURIComponent(datasetNameInput);
      namedDataset = await createDatasetName(datasetId, datasetName);
    } catch (err) {
      error = String(err) || 'Error Creating Named Dataset';
      $state.current--;
      console.error('Error in createNamedDataset', err);
    }
  }

  async function checkExportStatus(lastPicsureResultId?: string) {
    let statusId = lastPicsureResultId ? lastPicsureResultId : datasetId;
    const path = 'picsure/query/' + statusId + '/status';
    try {
      const res = await api.post(path, query);
      picsureResultId = res.picsureResultId;
      return res.status;
    } catch (error) {
      console.error('Error in checkExportStatus', error); //TODO handle errors
    }
    return 'ERROR';
  }
</script>

<Stepper
  class="w-full h-full m-8"
  on:complete={onCompleteHandler}
  on:next={onNextHandler}
  on:step={onStepHandler}
  on:back={onBackHandler}
  buttonCompleteLabel="Export Data"
>
  <Step>
    <svelte:fragment slot="header">Review Cohort Detials:</svelte:fragment>
    <div id="first-step-container" class="flex flex-col w-full h-full items-center">
      <Summary />
      <section class="w-full">
        {#await preparePromise}
          <ProgressRadial width="w-4" />
          <div>Preparing your dataset...</div>
        {:catch}
          <div class="flex justify-center mb-4">
            <ErrorAlert
              title="An error occurred while preparing your dataset. Please try again. If this problem persists, please
                contact an administrator."
            />
          </div>
        {/await}
        <Datatable tableName="ExportSummary" data={rows} {columns} />
      </section>
    </div>
  </Step>
  {#if showTreeStep}
    <Step>
      <svelte:fragment slot="header">Finalize Data:</svelte:fragment>
      <section class="flex flex-col w-full h-full items-center">
        <Summary />
        <div class="w-full h-full m-2 card p-4">
          <header class="card-header">
            Select <strong>additional variables</strong> you would like to be included in your final
            data export.
          </header>
          <hr />
          <div class="card-body p-4">Tree Component Here</div>
        </div>
      </section>
    </Step>
  {/if}
  <Step locked={!datasetNameInput || datasetNameInput.length < 2}>
    <svelte:fragment slot="header">Save Dataset ID:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <div class="w-full h-full m-2 card p-4">
        <header class="card-header">
          Save the information in your final data export by clicking the Save Dataset ID button.
          Navigate to the <a class="anchor" href="/dataset">Dataset Management tab</a> to view or manage
          your Dataset IDs.
        </header>
        <hr />
        {#if error}
          <div class="w-full h-full m-2">
            <ErrorAlert title="Error">
              {error}
            </ErrorAlert>
          </div>
        {/if}
        <div class="card-body p-4 flex flex-col justify-center items-center">
          <div>
            <div class="flex items-center m-2">
              <label for="dataset-name" class="font-bold mr-2">Dataset Name:</label>
              <input
                type="text"
                id="dataset-name"
                class="w-80"
                placeholder="Enter a name"
                bind:value={datasetNameInput}
                required
              />
            </div>
            <div class="flex items-center m-2">
              <div class="flex items-center">
                <label for="dataset-id" class="font-bold mr-2">Dataset ID:</label>
                <div id="dataset-id">{datasetId}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Step>
  <Step locked={lockDownload}>
    <svelte:fragment slot="header">Export Data:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <Summary />
      <div class="w-full h-full m-2 card p-4">
        <div class="flex justify-center">
          {#if canDownload}
            {#await statusPromise}
              <div class="flex justify-center items-center">
                <ProgressRadial width="w-4" />
                <div>Prepareing your dataset...</div>
              </div>
            {:then status}
              <div class="flex flex-col items-center justify-center">
                <p>
                  Click the “Export Data” button below to download your participant-level cohort
                  data for research analysis.
                </p>
                <div>
                  Export Status: {status}
                  <i
                    class="fa-solid {status === 'ERROR'
                      ? 'fa-circle-xmark text-error-500'
                      : 'fa-check-circle text-success-500'}"
                  ></i>
                </div>
              </div>
            {:catch}
              <div class="flex justify-center">
                <ErrorAlert
                  title="An error occurred while preparing your dataset. Please try again. If this problem persists, please
                contact an administrator."
                />
              </div>
            {/await}
          {/if}
        </div>
        {#if apiExport}
          <div class="flex flex-col justify-center items-center">
            <div class="flex justify-center">
              Use your personal access token and the dataset ID to export your participant-level
              cohort data using the PIC-SURE API.
            </div>
            <UserToken />
            <div class="flex items-center m-4">
              <div class="flex items-center">
                <label for="dataset-id" class="font-bold ml-4 mr-2">Dataset ID:</label>
                <div id="dataset-id" class="mr-4">{datasetId}</div>
                <CopyButton itemToCopy={datasetId} />
              </div>
            </div>
            <p>
              Navigate to the <a class="anchor" href="/api">API page</a> to view examples and learn more
              about the PIC-SURE API.
            </p>
          </div>
        {/if}
      </div>
    </section>
  </Step>
</Stepper>

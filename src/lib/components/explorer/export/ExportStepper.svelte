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
  import { CodeBlock, ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ExportStore from '$lib/stores/Export';
  import { filters, totalParticipants } from '$lib/stores/Filter';
  let { exports } = ExportStore;
  import { state } from '$lib/stores/Stepper';
  import { goto } from '$app/navigation';
  import { type DatasetError } from '$lib/models/Dataset';
  import { createDatasetName } from '$lib/services/datasets';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import type { ExpectedResultType } from '$lib/models/query/Query.ts';
  import codeBlocks from '$lib/assets/codeBlocks.json';
  import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
  import Confirmation from '$lib/components/modals/Confirmation.svelte';
  import { branding, features, settings } from '$lib/configuration';
  export let query: QueryRequestInterface;
  export let showTreeStep = false;
  export let rows: ExportRowInterface[] = [];

  const modalStore = getModalStore();
  let statusPromise: Promise<string>;
  let preparePromise: Promise<void>;
  let datasetNameInput: string = '';
  let picsureResultId: string = '';
  let lockDownload = true;
  let error: string = '';
  $: datasetId = '';
  $: canDownload = true;
  $: apiExport = false;
  const columns = [
    { dataElement: 'variableName', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true },
  ];

  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1000000;

  function openConfirmationModal() {
    const onConfirm = async () => {
      await download();
      modalStore.close();
    };
    const onCancel = () => {
      modalStore.close();
    };
    const modal: ModalSettings = {
      type: 'component',
      title: branding.explorePage.confirmDownloadTitle || 'Are you sure you want to download data?',
      component: 'modalWrapper',
      modalClasses: 'bg-surface-100-800-token p-4 block',
      meta: {
        component: Confirmation,
        message: branding.explorePage.confirmDownloadMessage,
        onConfirm,
        onCancel,
        confirmText: 'Download',
      },
      response: (r: string) => {
        console.log(r);
      },
    };
    modalStore.trigger(modal);
  }

  async function download(): Promise<void> {
    try {
      const res = await api.post(`picsure/query/${datasetId}/result`, {});
      const responseDataUrl = URL.createObjectURL(new Blob([res], { type: 'octet/stream' }));
      if (browser) {
        const link = document.createElement('a');
        link.href = responseDataUrl;
        if (query.query.expectedResultType === 'DATAFRAME') {
          link.download = 'pic-sure-data.csv';
        } else if (query.query.expectedResultType === 'DATAFRAME_PFB') {
          link.download = 'pic-sure-data.avro';
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error in onCompleteHandler', error);
    }
  }
  function onNextHandler(e: CustomEvent): void {
    console.log('event:next', e);
    if (e.detail.step === 0 && !showTreeStep) {
      // nothing needs to be done here
      return;
    }
    if (e.detail.step === 1 && showTreeStep) {
      console.log('event:next', e);
      //TODO: Load tree
    } else if ((e.detail.step === 1 && !showTreeStep) || (showTreeStep && e.detail.step === 2)) {
      preparePromise = submitQuery();
    } else if ((e.detail.step === 2 && !showTreeStep) || (showTreeStep && e.detail.step === 3)) {
      createNamedDataset();
    }
    if (e.detail.state.total - 1 === e.detail.step + 1) {
      statusPromise = new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          const status = await checkExportStatus(picsureResultId);
          if (status === 'ERROR') {
            lockDownload = true;
            clearInterval(interval);
            reject(status);
          } else if (!['PENDING', 'RUNNING', 'QUEUED'].includes(status)) {
            lockDownload = false;
            clearInterval(interval);
            resolve(status);
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

  async function submitQuery(): Promise<void> {
    try {
      query.query.fields = $exports.map((exp) => exp.conceptPath);
      const res = await api.post('picsure/query', query);
      console.log('res', res);
      datasetId = res.picsureResultId;
    } catch (error) {
      $state.current--;
      console.error('Error in handleFirstStep', error);
      throw error;
    }
  }

  async function createNamedDataset() {
    try {
      await createDatasetName(datasetId, datasetNameInput);
    } catch (err) {
      if (err instanceof Object) {
        const errObj = err as DatasetError;
        error = errObj?.message?.message || 'Error Creating Named Dataset';
      } else {
        error = String(err) || 'Error Creating Named Dataset';
      }
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

  async function getSignedUrl(urlTemplate: string) {
    const path = 'picsure/query/' + datasetId + '/signed-url';
    try {
      const res = await api.post(path, query);
      let url = urlTemplate + encodeURIComponent(res.signedUrl);
      window.open(url);
    } catch (error) {
      console.error('Error in getSignedUrl', error);
    }
  }

  export let activeType: ExpectedResultType;
  function selectExportType(exportType: ExpectedResultType) {
    query.query.expectedResultType = exportType;
    activeType = exportType;
  }

  function onComplete() {
    goto('/explorer');
  }

  let tabSet: number = 0;
  $: terraLoading = false;

  function dataLimitExceeded(): boolean {
    let participantCount: number =
      typeof $totalParticipants === 'number' ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints: number = participantCount + $filters.length + $exports.length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }

  async function exportToTerra() {
    terraLoading = true;
    getSignedUrl("https://app.terra.bio/#import-data?format=pfb&url=");
    terraLoading = false;
  }
</script>

<Stepper
  class="w-full h-full m-8"
  on:complete={onComplete}
  on:next={onNextHandler}
  on:step={onStepHandler}
  on:back={onBackHandler}
  buttonCompleteLabel="Done"
>
  <Step locked={dataLimitExceeded()}>
    <svelte:fragment slot="header">Review Cohort Details:</svelte:fragment>
    <div id="first-step-container" class="flex flex-col w-full h-full items-center">
      <Summary />
      <section class="w-full">
        {#if dataLimitExceeded()}
          <aside class="alert variant-filled-error">
            <div><i class="fa-solid fa-triangle-exclamation text-4xl"></i></div>
            <div class="alert-message">
              <h3 class="h3">Warning</h3>
              <p>
                Warning: Your selected data exceeds 1,000,000 estimated data points, which is too
                large to export. Please reduce the data selection or the number of selected
                participants.
              </p>
            </div>
            <div class="alert-actions dark">
              <button class="btn variant-filled" on:click={() => onComplete()}>Back</button>
            </div>
          </aside>
        {:else}
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
        {/if}
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
  <Step locked={activeType === undefined}>
    <svelte:fragment slot="header">Review and Save Dataset:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <Summary />
      <div class="grid gap-10 grid-cols-2">
        <CardButton
          data-testid="csv-export-option"
          title="Export as Data Frame or CSV"
          subtitle="Export data as a Python or R data frame or a comma-separated values file"
          size="other"
          class="card variant-ringed-primary"
          active={activeType === 'DATAFRAME'}
          on:click={() => selectExportType('DATAFRAME')}
        ></CardButton>
        <CardButton
          data-testid="csv-export-option"
          title="Export as PFB"
          subtitle="Export data in Portable Format for Biomedical Data file format"
          size="other"
          class="card variant-ringed-primary"
          active={activeType === 'DATAFRAME_PFB'}
          on:click={() => selectExportType('DATAFRAME_PFB')}
        ></CardButton>
      </div>
    </section>
  </Step>
  <Step locked={!datasetNameInput || datasetNameInput.length < 2}>
    <svelte:fragment slot="header">Save Dataset ID:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <Summary />
      <div class="w-full h-full m-2 card p-4">
        <header class="card-header">
          Save the information in your final data export by clicking the Save Dataset ID button.
          Navigate to the <a class="anchor" href="/dataset">Manage Datasets page</a> to view or manage
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
    <svelte:fragment slot="header">Start Analysis:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <div class="flex justify-center">
        {#if canDownload}
          {#await statusPromise}
            <div class="flex justify-center items-center">
              <ProgressRadial width="w-4" />
              <div>Preparing your dataset...</div>
            </div>
          {:then}
            {#if query.query.expectedResultType === 'DATAFRAME'}
              <section class="flex flex-col gap-8">
                <p class="mt-4">
                  To export data and start your analysis, copy and paste the following code in an
                  analysis workspace, such as BioData Catalyst Powered by Seven Bridges or BioData
                  Catalyst Powered by Terra, to connect to PIC-SURE and save the data frame or
                  download the file. Note that you will need your personal access token to complete
                  the connection to PIC-SURE with code.
                </p>
                <TabGroup class="card p-4">
                  <Tab bind:group={tabSet} name="python" value={0}>Python</Tab>
                  <Tab bind:group={tabSet} name="r" value={1}>R</Tab>
                  <Tab bind:group={tabSet} name="download" value={2}>Download</Tab>
                  <svelte:fragment slot="panel">
                    {#if tabSet === 0}
                      <CodeBlock
                        language="python"
                        lineNumbers={true}
                        buttonCopied="Copied!"
                        code={codeBlocks?.bdcPythonExport?.replace('{{queryId}}', datasetId) ||
                          'Code not set'}
                      ></CodeBlock>
                    {:else if tabSet === 1}
                      <CodeBlock
                        language="r"
                        lineNumbers={true}
                        code={codeBlocks?.bdcRExport?.replace('{{queryId}}', datasetId) ||
                          'Code not set'}
                      ></CodeBlock>
                    {:else if tabSet === 2}
                      <div>
                        <button
                          class="btn variant-filled-primary"
                          on:click={() =>
                            features.confirmDownload ? openConfirmationModal() : download()}
                          ><i class="fa-solid fa-download mr-1"></i>Download as CSV</button
                        >
                      </div>
                    {/if}
                  </svelte:fragment>
                </TabGroup>
                <p>
                  Copy your personal access token and save as a text file called “token.txt” in the
                  same working directory to execute the code above.
                </p>
                <div class="flex justify-center">
                  <UserToken />
                </div>
                <div class="flex justify-center">
                  <a
                    class="btn variant-ghost-primary m-2 hover:variant-filled-primary"
                    href="https://platform.sb.biodatacatalyst.nhlbi.nih.gov/u/biodatacatalyst/data-export-from-the-pic-sure-ui"
                    target="_blank">Go to Seven Bridges</a
                  >
                  <a
                    class="btn variant-ghost-primary m-2 hover:variant-filled-primary"
                    href="https://terra.biodatacatalyst.nhlbi.nih.gov/"
                    target="_blank">Go to Terra</a
                  >
                </div>
              </section>
              <!--<section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6">
                  {#each branding.apiPage.cards as card}
                    <a
                            href={card.link}
                            target={card.link.startsWith('http') ? '_blank' : '_self'}
                            class="pic-sure-info-card p-4 basis-2/4"
                    >
                      <div class="card card-hover">
                        <header class="card-header flex flex-col items-center">
                          <h4 class="my-1" data-testid={card.header}>{card.header}</h4>
                          <hr class="!border-t-2" />
                        </header>
                        <section class="p-4 whitespace-pre-wrap flex flex-col" data-testid={card.body}>
                          <div>{card.body}</div>
                          <div class="flex justify-center">
                            <div class="btn variant-filled-primary mt-3 w-fit">Learn More</div>
                          </div>
                        </section>
                      </div>
                    </a>
                  {/each}
                </section>-->
              <!--<div class="flex flex-col items-center justify-center">
                  <div>
                    Export Status: {status}
                    <i
                      class="fa-solid {status === 'ERROR'
                        ? 'fa-circle-xmark text-error-500'
                        : 'fa-check-circle text-success-500'}"
                    ></i>
                  </div>
                </div>-->
            {:else if query.query.expectedResultType === 'DATAFRAME_PFB'}
              <section class="flex flex-col gap-8">
                <div class="flex justify-center mt-4">
                  Select an option below to export your selected data in PFB format.
                </div>
                {#if features.explorer.enableTerraExport}
                  <div class="grid grid-cols-3">
                    <div></div>
                    <div>
                      <button disabled="{terraLoading}" class="flex-initial w-64 btn variant-filled-primary" on:click={() => exportToTerra()}
                      ><i class="fa-solid fa-arrow-up-right-from-square"></i>Export to Terra</button
                      >
                    </div>
                  </div>
                {/if}
                <div class="grid grid-cols-3">
                  <div></div>
                  <div>
                    <button
                            class="flex-initial w-64 btn variant-filled-primary"
                            on:click={() =>
                        features.confirmDownload ? openConfirmationModal() : download()}
                    ><i class="fa-solid fa-download"></i>Download as PFB</button
                    >
                  </div>
                </div>
              </section>
            {/if}
          {:catch e}
            <div class="flex justify-center">
              <ErrorAlert
                title="An error occurred while preparing your dataset. Please try again. If this problem persists, please
                contact an administrator."
              />
              <div class="hidden">{e}</div>
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
    </section>
  </Step>
</Stepper>

<style>
  input {
    border-radius: var(--theme-rounded-base);
  }
</style>

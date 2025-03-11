<script lang="ts">
  import * as api from '$lib/api';
  import { v4 as uuidv4 } from 'uuid';
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
  let { exports, addExports, removeExports } = ExportStore;
  import { state } from '$lib/stores/Stepper';
  import { goto } from '$app/navigation';
  import { type DatasetError } from '$lib/models/Dataset';
  import { createDatasetName } from '$lib/services/datasets';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import { Query, type ExpectedResultType } from '$lib/models/query/Query.ts';
  import codeBlocks from '$lib/assets/codeBlocks.json';
  import { getModalStore, type ModalSettings, getToastStore } from '@skeletonlabs/skeleton';
  import Confirmation from '$lib/components/modals/Confirmation.svelte';
  import { branding, features, settings, resources } from '$lib/configuration';
  import { searchDictionary } from '$lib/services/dictionary';
  import type { ExportInterface } from '$lib/models/Export';
  import { onMount } from 'svelte';
  export let query: QueryRequestInterface;
  export let showTreeStep = false;
  export let rows: ExportRowInterface[] = [];

  const modalStore = getModalStore();
  const toastStore = getToastStore();
  let statusPromise: Promise<string>;
  let preparePromise: Promise<void>;
  let datasetNameInput: string = '';
  let picsureResultId: string = '';
  let lockDownload = true;
  let error: string = '';
  let sampleIds = false;
  let lastExports: ExportRowInterface[] = [];
  let loadingSampleIds = false;
  let checkingSampleIds = false;
  $: datasetId = '';
  $: canDownload = true;
  $: apiExport = false;
  const columns = [
    { dataElement: 'variableName', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true, class: 'text-center' },
  ];

  onMount(async () => {
    const exportedSampleIds = $exports.filter((e: ExportInterface) =>
      e.conceptPath.includes('SAMPLE_ID'),
    );
    if (exportedSampleIds.length > 0) {
      checkingSampleIds = true;
      const genomicConcepts = await getGenomicConcepts();
      if (genomicConcepts.length > 0) {
        // Find sample IDs that match genomic concepts
        const matchingSampleIds = exportedSampleIds.filter((sampleId) =>
          genomicConcepts.some((concept) => concept.conceptPath === sampleId.conceptPath),
        );
        sampleIds = matchingSampleIds.length === genomicConcepts.length;
        checkingSampleIds = false;
        if (sampleIds) {
          lastExports = matchingSampleIds.map((item) => ({
            ref: item,
            variableId: item.conceptPath,
            variableName: item.display,
            description: item.searchResult?.description,
            type: item.searchResult?.type,
            selected: true,
          })) as ExportRowInterface[];
        }
      } else {
        sampleIds = false;
        checkingSampleIds = false;
      }
    } else {
      sampleIds = false;
    }
  });

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
        message:
          branding.explorePage.confirmDownloadMessage ||
          'This action will download the data to your local machine. Are you sure you want to proceed?',
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
    if (e.detail.step === 0 && !showTreeStep) {
      // nothing needs to be done here
      return;
    }
    if (e.detail.step === 1 && showTreeStep) {
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

  async function getSignedUrl() {
    const path = 'picsure/query/' + datasetId + '/signed-url';
    try {
      const res = await api.post(path, query);
      return res.signedUrl;
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
  $: exportLoading = false;

  function dataLimitExceeded(): boolean {
    let participantCount: number =
      typeof $totalParticipants === 'number' ? $totalParticipants : MAX_DATA_POINTS_FOR_EXPORT + 1;
    let totalDataPoints: number = participantCount + $filters.length + $exports.length;
    return totalDataPoints > MAX_DATA_POINTS_FOR_EXPORT;
  }

  async function getGenomicConcepts() {
    const concepts = await searchDictionary(
      '',
      [
        {
          name: 'data_source_genomic',
          category: 'data_source',
          display: 'Genomic',
          description: 'Associated with genomic data',
          count: 0,
        },
      ],
      { pageNumber: 0, pageSize: 10000 },
    );

    if (concepts.content.length === 0) {
      return [];
    }

    // Get sample ID counts via cross counts query
    const crossCountQuery = new Query(structuredClone(query.query));
    crossCountQuery.expectedResultType = 'CROSS_COUNT';
    const crossCountFields = concepts.content.map((concept) => concept.conceptPath);
    crossCountQuery.setCrossCountFields(crossCountFields);

    const crossCountResponse: Record<string, number> = await api.post('picsure/query/sync', {
      query: crossCountQuery,
      resourceUUID: resources.hpds,
    });

    // Filter and return only concepts with counts > 0
    return concepts.content.filter((concept) => crossCountResponse[concept.conceptPath] > 0);
  }

  async function toggleSampleIds() {
    try {
      loadingSampleIds = true;
      if (!sampleIds) {
        const exportsToRemove: ExportInterface[] = lastExports?.map(
          (e) => e.ref,
        ) as ExportInterface[];
        removeExports(exportsToRemove || []);
        rows = rows.filter((r) => !lastExports.some((le) => le.variableId === r.variableId));
        return;
      }

      const genomicConcepts = await getGenomicConcepts();

      // Create new exports for each concept
      const newExports = genomicConcepts.map(
        (concept) =>
          ({
            id: uuidv4(),
            searchResult: concept,
            display: concept?.display || '',
            conceptPath: concept?.conceptPath || '',
          }) as ExportInterface,
      );

      // Add exports and create corresponding rows
      addExports(newExports);
      const newRows = newExports.map(
        (e) =>
          ({
            ref: e,
            variableId: e?.searchResult?.conceptPath,
            variableName: e?.display,
            description: e?.searchResult?.description,
            type: e?.searchResult?.type,
            selected: true,
          }) as ExportRowInterface,
      );
      //Remove duplicates
      rows = Array.from(
        [...rows, ...newRows]
          .reduce((map, row) => map.set(row.variableId, row), new Map())
          .values(),
      );
      lastExports = newRows;
    } catch (error) {
      console.error('Error in toggleSampleIds', error);
      toastStore.trigger({
        message:
          'We were unable to fetch the sample IDs for your selected data. Please try again later.',
        background: 'variant-ghost-error',
      });
      sampleIds = false;
    } finally {
      loadingSampleIds = false;
    }
  }

  async function exportToTerra() {
    exportLoading = true;
    let signedUrl = await getSignedUrl();
    window.open(
      'https://terra.biodatacatalyst.nhlbi.nih.gov/#import-data?format=pfb&url=' +
        encodeURIComponent(signedUrl),
    );
    exportLoading = false;
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
          {#if !loadingSampleIds}
            <Datatable tableName="ExportSummary" data={rows} {columns} />
            {#if features.explorer.enableSampleIdCheckbox}
              <div>
                <label
                  for="sample-ids-checkbox"
                  class="flex items-center"
                  data-testid="sample-ids-label"
                >
                  {#if checkingSampleIds}
                    <ProgressRadial width="w-4" />
                  {:else}
                    <input
                      type="checkbox"
                      class="mr-1 &[aria-disabled=“true”]:opacity-75"
                      data-testid="sample-ids-checkbox"
                      id="sample-ids-checkbox"
                      bind:checked={sampleIds}
                      on:change={toggleSampleIds}
                    />
                  {/if}
                  <span>Include sample identifiers</span>
                </label>
              </div>
            {/if}
          {:else}
            <div class="flex justify-center items-center">
              <ProgressRadial width="w-4" />
              <div>Loading sample IDs...</div>
            </div>
          {/if}
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
            {:else if query.query.expectedResultType === 'DATAFRAME_PFB'}
              <section class="flex flex-col gap-8">
                <div class="flex justify-center mt-4">
                  Select an option below to export your selected data in PFB format.
                </div>
                {#if features.explorer.enableTerraExport}
                  <div class="grid grid-cols-3">
                    <div></div>
                    <div>
                      <button
                        disabled={exportLoading}
                        class="flex-initial w-64 btn variant-filled-primary disabled:variant-ghost-primary"
                        on:click={() => exportToTerra()}
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
  input[type='text'] {
    border-radius: var(--theme-rounded-base);
  }
</style>

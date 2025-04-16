<script lang="ts">
  import { onMount } from 'svelte';
  import { CodeBlock, ProgressRadial, Tab, TabGroup } from '@skeletonlabs/skeleton';
  import { getModalStore, type ModalSettings, getToastStore } from '@skeletonlabs/skeleton';
  import { v4 as uuidv4 } from 'uuid';

  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  import * as api from '$lib/api';
  import { branding, features, settings, resources } from '$lib/configuration';

  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import type { DataSet } from '$lib/models/Dataset';
  import type { ExportInterface } from '$lib/models/Export';
  import { Query, type ExpectedResultType } from '$lib/models/query/Query.ts';
  import { state } from '$lib/stores/Stepper';
  import { exports, addExports, removeExports } from '$lib/stores/Export';
  import { filters, totalParticipants } from '$lib/stores/Filter';
  import { searchDictionary } from '$lib/stores/Dictionary';
  import { createDatasetName } from '$lib/services/datasets';

  import Stepper from '$lib/components/steppers/horizontal/Stepper.svelte';
  import Step from '$lib/components/steppers/horizontal/Step.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Confirmation from '$lib/components/modals/Confirmation.svelte';
  import Summary from './Summary.svelte';

  export let query: QueryRequestInterface;
  export let showTreeStep = false;
  export let rows: ExportRowInterface[] = [];

  interface DataSetResponse {
    picsureResultId?: string;
  }

  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1000000;
  const modalStore = getModalStore();
  const toastStore = getToastStore();
  const PROMISE_WAIT_INTERVAL = 7;

  const columns = [
    { dataElement: 'variableName', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true, class: 'text-center' },
  ];

  let activeType: ExpectedResultType;
  let statusPromise: Promise<unknown>;
  let preparePromise: Promise<void>;
  let datasetIdPromise: Promise<void | DataSetResponse>;
  let saveDatasetPromise: Promise<DataSet>;
  let datasetNameInput: string = '';
  let picsureResultId: string = '';
  let lockDownload = true;
  let sampleIds = false;
  let lastExports: ExportRowInterface[] = [];
  let loadingSampleIds = false;
  let checkingSampleIds = false;
  let tabSet: number = 0;

  $: datasetId = '';
  $: processingMessage = '';
  $: exportLoading = false;

  // Auto select csv export when pfb feature is disabled.
  if (!features.explorer.enablePfbExport) {
    query.query.expectedResultType === 'DATAFRAME';
    activeType = 'DATAFRAME';
  }

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

  async function onNextHandler(e: CustomEvent): Promise<void> {
    const lastStepName = $state.stepMap[$state.current - 1] || '';
    const stepName = e.detail.name;

    // nothing needs to be on review step
    if (stepName === 'review') return;

    if (lastStepName === 'review') {
      preparePromise = submitQuery();
    }

    if (stepName === 'start') {
      saveDatasetPromise = createDatasetName(datasetId, datasetNameInput).then((data: DataSet) => {
        statusPromise = checkExportStatus(picsureResultId);
        return data;
      });
    }
  }

  async function submitQuery(): Promise<void> {
    let interval: NodeJS.Timeout;
    const statetext = {
      initial: 'Creating dataset ID...',
      waiting: 'Hang tight. We are still working on it...',
      retry: "Something's taking longer than usual. We are still working on it...",
    };

    function requestUpdate(method: () => Promise<void | DataSetResponse>, retry: boolean = true) {
      processingMessage = retry ? statetext.initial : statetext.retry;
      if (retry) {
        interval = setInterval(() => {
          processingMessage = statetext.waiting;
        }, PROMISE_WAIT_INTERVAL * 1000);
      }
      datasetIdPromise = method()
        .finally(() => clearInterval(interval))
        .catch((err) => {
          if (retry) {
            requestUpdate(method, false);
          } else {
            throw err;
          }
        });
    }

    try {
      query.query.fields = $exports.map((exp) => exp.conceptPath);
      datasetId = '';
      requestUpdate(() =>
        api.post('picsure/query', query).then((res: DataSetResponse) => {
          datasetId = res.picsureResultId || 'Error';
        }),
      );
      await datasetIdPromise;
    } catch (error) {
      $state.current--;
      console.error('Error in submitQuery', error);
      throw error;
    }
  }

  function checkExportStatus(lastPicsureResultId?: string) {
    const statusId = lastPicsureResultId || datasetId;
    return api
      .post('picsure/query/' + statusId + '/status', query)
      .then((res: { picsureResultId: string; status: string }) => {
        if (res.status === 'ERROR') {
          lockDownload = true;
          return Promise.reject(res.status);
        }
        picsureResultId = res.picsureResultId;
        lockDownload = false;
      });
  }

  function selectExportType(exportType: ExpectedResultType) {
    query.query.expectedResultType = exportType;
    activeType = exportType;
  }

  function onComplete() {
    goto('/explorer');
  }

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

  async function exportSignedToUrl(url?: string) {
    async function getSignedUrl() {
      const path = 'picsure/query/' + datasetId + '/signed-url';
      try {
        const res = await api.post(path, query);
        return res.signedUrl;
      } catch (error) {
        console.error('Error in getSignedUrl', error);
      }
    }
    if (!url) return;
    exportLoading = true;
    let signedUrl = await getSignedUrl();
    if (signedUrl) {
      window.open(url + encodeURIComponent(signedUrl));
    }
    exportLoading = false;
  }
</script>

<Stepper
  class="w-full h-full m-8"
  on:complete={onComplete}
  on:next={onNextHandler}
  buttonCompleteLabel="Done"
>
  <Step name="review" locked={dataLimitExceeded()}>
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
                      class="input mr-1 &[aria-disabled=“true”]:opacity-75"
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
    <Step name="select-variables">
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
  {#if features.explorer.enablePfbExport}
    <Step name="select-type" locked={activeType === undefined}>
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
  {/if}
  <Step name="save-dataset" locked={!datasetNameInput || datasetNameInput.length < 2 || !datasetId}>
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
        <div class="card-body p-4 flex flex-col justify-center items-center">
          <div>
            <div class="flex items-center m-2">
              <label for="dataset-name" class="font-bold mr-2">Dataset Name:</label>
              <input
                type="text"
                id="dataset-name"
                class="input w-80"
                placeholder="Enter a name"
                bind:value={datasetNameInput}
                required
              />
            </div>
            <div class="flex items-center m-2">
              <div class="flex items-center">
                <label for="dataset-id" class="font-bold mr-2">Dataset ID:</label>
                {#await datasetIdPromise}
                  <ProgressRadial width="w-4" />
                  <div>{processingMessage}</div>
                {:then}
                  <div id="dataset-id" class="mr-4">{datasetId}</div>
                {:catch}
                  <div>An error occurred while getting the dataset ID. Please try again later.</div>
                {/await}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Step>
  <Step name="start" locked={lockDownload}>
    <svelte:fragment slot="header">Start Analysis:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      {#await saveDatasetPromise}
        <div class="flex justify-center items-center">
          <ProgressRadial width="w-4" />
          <div>Saving your dataset...</div>
        </div>
      {:then}
        <div class="flex justify-center">
          {#await statusPromise}
            <div class="flex justify-center items-center">
              <ProgressRadial width="w-4" />
              <div>Preparing your dataset...</div>
            </div>
          {:then}
            {#if query.query.expectedResultType === 'DATAFRAME'}
              <section class="flex flex-col gap-8">
                <p class="mt-4">{branding.explorePage.analysisExportText}</p>
                <TabGroup class="card p-4">
                  <Tab bind:group={tabSet} name="python" value={0}>Python</Tab>
                  <Tab bind:group={tabSet} name="r" value={1}>R</Tab>
                  {#if features.explorer.allowDownload}
                    <Tab bind:group={tabSet} name="download" value={2}>Download</Tab>
                  {/if}
                  <svelte:fragment slot="panel">
                    {#if tabSet === 0}
                      <CodeBlock
                        language="python"
                        lineNumbers={true}
                        buttonCopied="Copied!"
                        code={branding.explorePage.codeBlocks.PythonExport.replace(
                          '{{queryId}}',
                          datasetId,
                        ) || 'Code not set'}
                      />
                    {:else if tabSet === 1}
                      <CodeBlock
                        language="r"
                        lineNumbers={true}
                        buttonCopied="Copied!"
                        code={branding.explorePage.codeBlocks.RExport.replace(
                          '{{queryId}}',
                          datasetId,
                        ) || 'Code not set'}
                      />
                    {:else if features.explorer.allowDownload && tabSet === 2}
                      <button
                        class="btn variant-filled-primary"
                        on:click={() =>
                          features.confirmDownload ? openConfirmationModal() : download()}
                        ><i class="fa-solid fa-download mr-1"></i>Download as CSV</button
                      >
                    {/if}
                  </svelte:fragment>
                </TabGroup>
                <p>{branding.explorePage.goTo.instructions}</p>
                <div class="flex justify-center">
                  <UserToken />
                </div>
                {#if branding.explorePage.goTo.links.length > 0}
                  <div class="flex justify-center">
                    {#each branding.explorePage.goTo.links as link}
                      <a
                        class="btn variant-ghost-primary m-2 hover:variant-filled-primary"
                        href={link.url}
                        target={link.newTab ? '_blank' : '_self'}>{link.title}</a
                      >
                    {/each}
                  </div>
                {/if}
              </section>
            {:else if query.query.expectedResultType === 'DATAFRAME_PFB' && features.explorer.enablePfbExport}
              <section class="flex flex-col gap-8 place-items-center">
                <div class="flex justify-center mt-4">
                  Select an option below to export your selected data in PFB format.
                </div>
                {#if branding.explorePage?.pfbExportUrls && branding.explorePage.pfbExportUrls.length > 0}
                  {#each branding.explorePage.pfbExportUrls as exportLink}
                    <button
                      disabled={exportLoading}
                      class="flex-initial w-64 btn variant-filled-primary disabled:variant-ghost-primary"
                      on:click={() => exportSignedToUrl(exportLink.url)}
                      ><i class="fa-solid fa-arrow-up-right-from-square"></i>Export to {exportLink.title}</button
                    >
                  {/each}
                {/if}
                <button
                  class="flex-initial w-64 btn variant-filled-primary"
                  on:click={() => (features.confirmDownload ? openConfirmationModal() : download())}
                  ><i class="fa-solid fa-download"></i>Download as PFB</button
                >
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
        </div>
      {:catch}
        <div class="flex justify-center">
          <ErrorAlert
            title="An error occurred while saving your dataset. Please try again. If this problem persists, please
            contact an administrator."
          />
        </div>
      {/await}
    </section>
  </Step>
</Stepper>

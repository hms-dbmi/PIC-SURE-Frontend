<script lang="ts">
  import { onMount } from 'svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
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
  import { stepperState } from '$lib/stores/Stepper';
  import { exports, addExports, removeExports } from '$lib/stores/Export';
  import { filters, totalParticipants } from '$lib/stores/Filter';
  import { searchDictionary } from '$lib/stores/Dictionary';
  import { toaster } from '$lib/toaster';
  import { createDatasetName } from '$lib/services/datasets';

  import Stepper from '$lib/components/steppers/horizontal/Stepper.svelte';
  import Step from '$lib/components/steppers/horizontal/Step.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import TabItem from '$lib/components/TabItem.svelte';

  interface Props {
    query: QueryRequestInterface;
    showTreeStep?: boolean;
    rows?: ExportRowInterface[];
  }

  const { query, showTreeStep = false, rows = [] }: Props = $props();

  let activeRows: ExportRowInterface[] = $state(rows);

  interface DataSetResponse {
    picsureResultId?: string;
  }

  const MAX_DATA_POINTS_FOR_EXPORT = settings.maxDataPointsForExport || 1000000;
  const PROMISE_WAIT_INTERVAL = 7;

  const columns = [
    { dataElement: 'variableName', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true, class: 'text-center' },
  ];

  let activeType: ExpectedResultType | undefined = $state(undefined);
  let statusPromise: Promise<unknown> = $state(Promise.resolve());
  let preparePromise: Promise<void> = $state(Promise.resolve());
  let datasetIdPromise: Promise<void | DataSetResponse> = $state(Promise.resolve());
  let saveDatasetPromise: Promise<void | DataSet> = $state(Promise.resolve());
  let datasetNameInput: string = $state('');
  let picsureResultId: string = $state('');
  let lockDownload = $state(true);
  let sampleIds = $state(false);
  let lastExports: ExportRowInterface[] = $state([]);
  let loadingSampleIds = $state(false);
  let checkingSampleIds = $state(false);
  let tabSet: string = $state('Python');
  let modalOpen: boolean = $state(false);

  let datasetId: string = $state('');
  let processingMessage: string = $state('');
  let exportLoading: boolean = $state(false);

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
          genomicConcepts.some(
            (concept: { conceptPath: string }) => concept.conceptPath === sampleId.conceptPath,
          ),
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

    // Auto select csv export when pfb feature is disabled.
    if (!features.explorer.enablePfbExport) {
      activeType = 'DATAFRAME';
    }
  });

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

  async function onNextHandler(_step: number, stepName: string): Promise<void> {
    // nothing needs to be on review step
    if (stepName === 'review') return;

    if (stepName === 'save-dataset') {
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
      query.query.expectedResultType = activeType || 'DATAFRAME';
      datasetId = '';
      requestUpdate(() =>
        api.post('picsure/query', query).then((res: DataSetResponse) => {
          datasetId = res.picsureResultId || 'Error';
        }),
      );
      await datasetIdPromise;
    } catch (error) {
      $stepperState.current--;
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
        activeRows = activeRows.filter(
          (r) => !lastExports.some((le) => le.variableId === r.variableId),
        );
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
      activeRows = Array.from(
        [...activeRows, ...newRows]
          .reduce((map, row) => map.set(row.variableId, row), new Map())
          .values(),
      );
      lastExports = newRows;
    } catch (error) {
      console.error('Error in toggleSampleIds', error);
      toaster.error({
        description:
          'We were unable to fetch the sample IDs for your selected data. Please try again later.',
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

  $inspect(tabSet);
</script>

<Modal
  bind:open={modalOpen}
  title={branding.explorePage.confirmDownloadTitle || 'Are you sure you want to download data?'}
  width="w-1/2"
  withDefault
  confirmText="Download"
  cancelText="Cancel"
  onconfirm={() => download()}
>
  {branding.explorePage.confirmDownloadMessage ||
    'This action will download the data to your local machine. Are you sure you want to proceed?'}
</Modal>
<Stepper
  class="w-full h-full m-8"
  oncomplete={onComplete}
  onnext={onNextHandler}
  buttonCompleteLabel="Done"
>
  <Step name="review" locked={dataLimitExceeded()}>
    {#snippet header()}Review Cohort Details:{/snippet}
    <div id="first-step-container" class="flex flex-col w-full h-full items-center">
      <Summary />
      <section class="w-full">
        {#if dataLimitExceeded()}
          <ErrorAlert
            data-testid="landing-error"
            title="Warning"
            color="warning"
            closeText="Back"
            onclose={onComplete}
          >
            Warning: Your selected data exceeds 1,000,000 estimated data points, which is too large
            to export. Please reduce the data selection or the number of selected participants.
          </ErrorAlert>
        {:else}
          {#await preparePromise}
            <Loading ring label="Preparing" />
          {:catch}
            <div class="flex justify-center mb-4">
              <ErrorAlert
                title="An error occurred while preparing your dataset. Please try again. If this problem persists, please
                  contact an administrator."
              />
            </div>
          {/await}
          {#if !loadingSampleIds}
            <Datatable tableName="ExportSummary" data={activeRows} {columns} />
            {#if features.explorer.enableSampleIdCheckbox}
              <div>
                <label
                  for="sample-ids-checkbox"
                  class="flex items-center"
                  data-testid="sample-ids-label"
                >
                  {#if checkingSampleIds}
                    <Loading ring />
                  {:else}
                    <input
                      type="checkbox"
                      class="mr-1 &[aria-disabled=“true”]:opacity-75"
                      data-testid="sample-ids-checkbox"
                      id="sample-ids-checkbox"
                      bind:checked={sampleIds}
                      onchange={toggleSampleIds}
                    />
                  {/if}
                  <span>Include sample identifiers</span>
                </label>
              </div>
            {/if}
          {:else}
            <Loading ring size="micro" label="Loading sample IDs" />
          {/if}
        {/if}
      </section>
    </div>
  </Step>
  {#if showTreeStep}
    <Step name="select-variables">
      {#snippet header()}Finalize Data:{/snippet}
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
      {#snippet header()}Review and Save Dataset:{/snippet}
      <section class="flex flex-col w-full h-full items-center">
        <Summary />
        <div class="grid gap-10 grid-cols-2">
          <CardButton
            data-testid="csv-export-option"
            title="Export as Data Frame or CSV"
            subtitle="Export data as a Python or R data frame or a comma-separated values file"
            size="other"
            active={activeType === 'DATAFRAME'}
            onclick={() => (activeType = 'DATAFRAME')}
          ></CardButton>
          <CardButton
            data-testid="pfb-export-option"
            title="Export as PFB"
            subtitle="Export data in Portable Format for Biomedical Data file format"
            size="other"
            active={activeType === 'DATAFRAME_PFB'}
            onclick={() => (activeType = 'DATAFRAME_PFB')}
          ></CardButton>
        </div>
      </section>
    </Step>
  {/if}
  <Step name="save-dataset" locked={!datasetNameInput || datasetNameInput.length < 2 || !datasetId}>
    {#snippet header()}Save Dataset ID:{/snippet}
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
                  <Loading ring size="micro" label={processingMessage} />
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
    {#snippet header()}Start Analysis:{/snippet}
    <section class="flex flex-col w-full h-full items-center">
      {#await saveDatasetPromise}
        <Loading ring size="medium" label="Saving" />
      {:then}
        <div class="flex justify-center">
          {#await statusPromise}
            <Loading ring size="medium" label="Preparing" />
          {:then}
            {#if query.query.expectedResultType === 'DATAFRAME'}
              <section class="flex flex-col gap-8">
                <p class="mt-4">{branding.explorePage.analysisExportText}</p>
                <Tabs value={tabSet} onValueChange={(e: { value: string }) => (tabSet = e.value)}>
                  {#snippet list()}
                    <TabItem bind:group={tabSet} value="Python">Python</TabItem>
                    <TabItem bind:group={tabSet} value="R">R</TabItem>
                    {#if features.explorer.allowDownload}
                      <TabItem bind:group={tabSet} value="Download">Download</TabItem>
                    {/if}
                  {/snippet}
                  {#snippet content()}
                    <Tabs.Panel value="Python">
                      <CodeBlock
                        lang="python"
                        code={branding.explorePage.codeBlocks.PythonExport.replace(
                          '{{queryId}}',
                          datasetId,
                        ) || 'Code not set'}
                      />
                    </Tabs.Panel>
                    <Tabs.Panel value="R">
                      <CodeBlock
                        lang="r"
                        code={branding.explorePage.codeBlocks.RExport.replace(
                          '{{queryId}}',
                          datasetId,
                        ) || 'Code not set'}
                      />
                    </Tabs.Panel>
                    {#if features.explorer.allowDownload}
                      <Tabs.Panel value="Download">
                        <button
                          class="btn preset-filled-primary-500"
                          onclick={() =>
                            features.confirmDownload ? (modalOpen = true) : download()}
                          ><i class="fa-solid fa-download mr-1"></i>Download as CSV</button
                        >
                      </Tabs.Panel>
                    {/if}
                  {/snippet}
                </Tabs>
                <p>{branding.explorePage.goTo.instructions}</p>
                <div class="flex justify-center">
                  <UserToken />
                </div>
                {#if branding.explorePage.goTo.links.length > 0}
                  <div class="flex justify-center">
                    {#each branding.explorePage.goTo.links as link}
                      <a
                        class="btn preset-tonal-primary border border-primary-500 m-2 hover:preset-filled-primary-500"
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
                      class="flex-initial w-64 btn preset-filled-primary-500 disabled:preset-tonal-primary border border-primary-500"
                      onclick={() => exportSignedToUrl(exportLink.url)}
                      ><i class="fa-solid fa-arrow-up-right-from-square"></i>Export to {exportLink.title}</button
                    >
                  {/each}
                {/if}
                <button
                  class="flex-initial w-64 btn preset-filled-primary-500"
                  onclick={() => (features.confirmDownload ? (modalOpen = true) : download())}
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

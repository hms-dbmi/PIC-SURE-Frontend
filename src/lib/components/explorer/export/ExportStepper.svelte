<script lang="ts">
  import Stepper from "$lib/components/steppers/horizontal/Stepper.svelte";
  import Step from "$lib/components/steppers/horizontal/Step.svelte";
  import Datatable from '$lib/components/datatable/Table.svelte';
  import { Query } from "$lib/models/query/Query";
  import Summary from "./Summary.svelte";
    import UserToken from "$lib/components/UserToken.svelte";
    import CopyButton from "$lib/components/buttons/CopyButton.svelte";
    import { generateDatasetName } from "$lib/DatasetNameGen";

  const tableName = 'ExportSummary';
  export let query: Query = JSON.parse('{"categoryFilters":{},"numericFilters":{"SOME_PATH_NAME":{"min":"10","max":"44"}},"requiredFields":[],"anyRecordOf":[],"variantInfoFilters":[{"categoryVariantInfoFilters":{},"numericVariantInfoFilters":{}}],"expectedResultType":"COUNT"}');
  export let showTreeStep = false;
  // $: participantsCount = 0;
  // $: variablesCount = 0;
  // $: dataPoints = 0;
  $: datasetId = '00000000-0000-0000-0000-000000000000'; //TODO: Generate a UUID for the dataset ID
  $: canDownload = true;
  $: apiExport = true;
  $: datasetNamePlaceholder = query && generateDatasetName(query);
  const columns = [
    { dataElement: 'name', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true },
  ];

  function onCompleteHandler(e: Event): void { console.log('event:complete', e); }
  function onNextHandler(e: Event): void { console.log('event:next', e); }
  function onStepHandler(e: Event): void { console.log('event:next', e); }
  function onBackHandler(e: Event): void { console.log('event:next', e); }
</script>

<Stepper class="w-full h-full m-8" on:complete={onCompleteHandler} on:next={onNextHandler} on:step={onStepHandler} on:back={onBackHandler}>
  <Step>
    <svelte:fragment slot="header">Review Cohort Detials:</svelte:fragment>
    <div id="first-step-container" class="flex flex-col w-full h-full items-center">
      <Summary />
      <section class="w-full">
        <!-- <Datatable {tableName} data={query} {columns} /> -->
      </section>
    </div>
  </Step>
  {#if showTreeStep}
  <Step>
    <svelte:fragment slot="header">Finalize Data:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <Summary />
      <div class="w-full h-full m-2 card p-4">
        <header class="card-header">Select <strong>additional variables</strong> you would like to be included in your final data export.</header>
        <hr />
        <div class="card-body p-4">
          Tree Component Here
        </div>
      </div>
    </section>
  </Step>
  {/if}
  <Step>
    <svelte:fragment slot="header">Save Dataset ID:</svelte:fragment>
    <section class="flex flex-col w-full h-full items-center">
      <div class="w-full h-full m-2 card p-4">
        <header class="card-header">Save the information in your final data export by clicking the Save Dataset ID button.  Navigate to the <a class="anchor" href="/dataset">Dataset Management tab</a> to view or manage your Dataset IDs.</header>
        <hr />
        <div class="card-body p-4 flex flex-col justify-center items-center">
          <div class="flex items-center m-2">
            <label for="dataset-name" class="font-bold mr-2">Dataset ID:</label>
            <input type="text" id="dataset-name" class="w-80" placeholder={datasetNamePlaceholder} />
          </div>
          <div class="flex items-center m-2">
            <div class="flex items-center">
              <label for="dataset-id" class="font-bold ml-4 mr-2">Dataset ID:</label>
              <div id="dataset-id">{datasetId}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Step>
  <Step>
    <svelte:fragment slot="header">Export Data:</svelte:fragment>
  <section class="flex flex-col w-full h-full items-center">
  <Summary />
  <div class="w-full h-full m-2 card p-4">
    <div>
      {#if canDownload && !apiExport}
        <div class="flex justify-center">
          Click the “Export Data” button below to download your participant-level cohort data for research analysis
        </div>
      {/if}
    </div>
    {#if apiExport}
    <div class="flex flex-col justify-center items-center">
      <div class="flex justify-center">Use your personal access token and the dataset ID to export your participant-level cohort data using the PIC-SURE API.</div>
      <UserToken />
      <div class="flex items-center m-4">
        <div class="flex items-center">
          <label for="dataset-id" class="font-bold ml-4 mr-2">Dataset ID:</label>
          <div id="dataset-id" class="mr-4">{datasetId}</div>
          <CopyButton itemToCopy={datasetId} />
        </div>
      </div>
      <p>Navigate to the <a href="/api">API page</a> to view examples and learn more about the PIC-SURE API</p>
    </div>
    {/if}
  </div>
  </section>
  </Step>
</Stepper>
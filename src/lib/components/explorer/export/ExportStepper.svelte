<script lang="ts">
  import Stepper from "$lib/components/steppers/horizontal/Stepper.svelte";
  import Step from "$lib/components/steppers/horizontal/Step.svelte";
  import Datatable from '$lib/components/datatable/Table.svelte';
    import { Query } from "$lib/models/query/Query";

  const tableName = 'ExportSummary';
  $: participantsCount = 0;
  $: variablesCount = 0;
  $: dataPoints = 0;
  export let query: Query;
  const columns = [
    { dataElement: 'name', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true },
  ];
</script>

<Stepper class="w-full h-full m-8">
  <Step>
    <svelte:fragment slot="header">Review Cohort Detials</svelte:fragment>
    <div id="first-step-container" class="w-full h-full">
      <div id="stats" class="w-2/3 flex justify-evenly">
        <label for="summary" class="mr-8">Summary:</label>
        <div id="summary" class="w-full grid grid-cols-3">
          <div class="flex">
            <span id="participants" class="mr-2">{participantsCount}</span>
            <label for="participants">Participants</label>
          </div>
          <div class="flex">
            <span id="variables" class="mr-2">{variablesCount}</span>
            <label for="variables">Variables</label>
          </div>
          <div class="flex">
            <span id="dataPoints" class="mr-2">{dataPoints}</span>
            <label for="dataPoints">Data Points</label>
          </div>
        </div>
      </div>

      <section>
        <Datatable {tableName} data={query} {columns} />
      </section>
    </div>
  </Step>
  <Step>
    <svelte:fragment slot="header">(header)</svelte:fragment>
    (content)
  </Step>
</Stepper>
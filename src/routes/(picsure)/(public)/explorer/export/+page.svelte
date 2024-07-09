<script lang="ts">
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import { AppBar } from '@skeletonlabs/skeleton';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import FilterStore from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
    import type { ExportRowInterface } from '$lib/models/ExportRow';
  let { getQueryRequest } = FilterStore;
  let { exports } = ExportStore;
  let { filters } = FilterStore;

  export let queryRequest: QueryRequestInterface =  getQueryRequest();
  let exportRows: ExportRowInterface[] = $exports.map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.variableId,
      variableName: exp.variableName,
      description: exp.searchResult?.description,
      type: exp.searchResult?.isCategorical ? 'Categorical' : 'Continuous',
    };
  })
  let filterRows: ExportRowInterface[] = $filters.map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      variableName: filter.searchResult?.display || filter.variableName,
      description: filter.searchResult?.description,
      type: filter.searchResult?.isCategorical ? 'Categorical' : 'Continuous',
    };
  })
</script>

<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
  <svelte:fragment slot="lead">
    <AngleButton
      angle="left"
      variant="ringed"
      color="primary"
      name="Back"
      on:click={() => history.back()}>Back to Cohort Builder</AngleButton
    >
  </svelte:fragment>
  Export Data for Research Analysis
</AppBar>
<section class="flex justify-center items-center w-full h-full mt-8">
  <ExportStepper query={queryRequest.query} rows={[...exportRows, ...filterRows]} />
</section>

<style>
</style>
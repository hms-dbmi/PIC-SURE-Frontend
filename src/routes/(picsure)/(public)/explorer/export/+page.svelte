<script lang="ts">
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import FilterStore from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import { state } from '$lib/stores/Stepper';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import Content from '$lib/components/Content.svelte';
  import { goto } from '$app/navigation';
  let { getQueryRequest } = FilterStore;
  let { exports } = ExportStore;
  let { filters } = FilterStore;

  let queryRequest: QueryRequestInterface = getQueryRequest();
  let exportRows: ExportRowInterface[] = $exports.map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.variableId,
      variableName: exp.variableName,
      description: exp.searchResult?.description,
      type: exp.searchResult?.type,
    };
  });
  let filterRows: ExportRowInterface[] = $filters.map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      variableName: filter.searchResult?.display || filter.variableName,
      description: filter.searchResult?.description,
      type: filter.searchResult?.type,
    };
  });
</script>

<Content
  backUrl="/explorer"
  backTitle="Back to Explore"
  backAction={() => {
    $state.current = 0;
  }}
  title="Export Data for Research Analysis"
>
  {#if $exports.length > 0 || $filters.length > 0}
    <section class="flex justify-center items-center w-full h-full mt-8">
      <ExportStepper query={queryRequest} rows={[...filterRows, ...exportRows]} />
    </section>
  {:else}
    <div class="flex flex-col items-center justify-center m-8">
      <p>No filters or exports have been created.</p>
      <div class="flex gap-4">
        <AngleButton
          name="back"
          on:click={() => {
            goto('/explorer');
          }}>Back to Explore</AngleButton
        >
        <button
          class="btn variant-filled-primary m-4"
          on:click={() => {
            alert('This would start the tour at some step');
          }}>Learn How</button
        >
      </div>
    </div>
  {/if}
</Content>

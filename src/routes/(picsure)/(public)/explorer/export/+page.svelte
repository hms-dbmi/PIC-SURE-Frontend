<script lang="ts">
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import { allFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';
  import { stepperState } from '$lib/stores/Stepper';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import Content from '$lib/components/Content.svelte';
  import { features } from '$lib/configuration';
  import { isUserLoggedIn } from '$lib/stores/User';
  import { goto } from '$app/navigation';

  let exportRows: ExportRowInterface[] = $exports.map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.conceptPath,
      name: exp.display || exp.searchResult?.display || exp.searchResult?.name,
      description: exp.searchResult?.description,
      type: exp.searchResult?.type,
    };
  });
  let filterRows: ExportRowInterface[] = $allFilters.map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      name: filter.searchResult?.display || filter.variableName,
      description: filter.searchResult?.description,
      type: filter.searchResult?.type,
    };
  });
  const systemFieldRows: ExportRowInterface[] = (
    features.explorer.exportSystemFields as string[]
  ).map((conceptPath: string) => ({
    selected: true,
    variableId: conceptPath,
    name: conceptPath.replace(/^\\/, '').replace(/\\$/, ''),
  }));
  exportRows = [...systemFieldRows, ...exportRows];
  stepperState.set({ ...$stepperState, current: 0, total: 0 });
</script>

<Content
  backUrl="/explorer"
  backTitle="Back to Explore"
  backAction={() => {
    $stepperState.current = 0;
  }}
  title="Export Data for Research Analysis"
>
  {#if !isUserLoggedIn()}
    <div class="flex flex-col items-center justify-center m-8">
      <p>You are not logged in. To export the data for your selected cohort, please log in.</p>
      <div class="flex gap-4">
        <button
          class="btn preset-filled-primary-500 m-4"
          onclick={() => {
            goto('/login');
          }}>Go to Login</button
        >
      </div>
    </div>
  {:else if $exports.length > 0 || $allFilters.length > 0}
    <section class="flex justify-center items-center w-full h-full mt-8">
      <ExportStepper rows={[...filterRows, ...exportRows]} />
    </section>
  {:else}
    <div class="flex flex-col items-center justify-center m-8">
      <p>No filters or exports have been created.</p>
      <div class="flex gap-4">
        <button
          class="btn preset-filled-primary-500 m-4"
          onclick={() => {
            goto('/explorer?startTour=true');
          }}>Learn How</button
        >
      </div>
    </div>
  {/if}
</Content>

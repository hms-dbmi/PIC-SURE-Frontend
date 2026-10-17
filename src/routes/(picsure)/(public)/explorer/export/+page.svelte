<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import ExportStepper from '#lib/explorer/export/ExportStepper.svelte';
  import { allFilters } from '#lib/query/filters.ts';
  import { exports } from '#lib/explorer/export/Export.ts';
  import type { ExportRowInterface } from '#lib/explorer/export/ExportRow.ts';
  import Content from '#lib/shell/Content.svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import { isUserLoggedIn } from '#lib/auth/User.ts';
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
  const systemFieldRows: ExportRowInterface[] = $derived(
    config.settings.exportSystemFields.map((conceptPath: string) => ({
      selected: true,
      variableId: conceptPath,
      name: conceptPath.replace(/^\\/, '').replace(/\\$/, ''),
    })),
  );
  const patientIdRow: ExportRowInterface = {
    selected: true,
    variableId: '\\_Patient ID\\',
    name: 'Patient ID',
    description: 'Patient identifier.',
    type: 'Categorical',
  };
</script>

<Content backUrl="/explorer" backTitle="Back to Explore" title="Export Data for Research Analysis">
  {#if !isUserLoggedIn()}
    <div class="flex flex-col items-center justify-center m-8">
      <p>You are not logged in. To export the data for your selected cohort, please log in.</p>
      <div class="flex gap-4">
        <Button
          class="m-4"
          onclick={() => {
            goto(resolve('login'));
          }}>Go to Login</Button
        >
      </div>
    </div>
  {:else if $exports.length > 0 || $allFilters.length > 0}
    <section class="flex justify-center items-center w-full h-full mt-8">
      <ExportStepper rows={[patientIdRow, ...systemFieldRows, ...filterRows, ...exportRows]} />
    </section>
  {:else}
    <div class="flex flex-col items-center justify-center m-8">
      <p>No filters or exports have been created.</p>
      <div class="flex gap-4">
        <Button
          class="m-4"
          onclick={() => {
            goto(resolve('explorer?startTour=true'));
          }}>Learn How</Button
        >
      </div>
    </div>
  {/if}
</Content>

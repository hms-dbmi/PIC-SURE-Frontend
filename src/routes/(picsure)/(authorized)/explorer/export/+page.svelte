<script lang="ts">
  import ExportStepper from '$lib/components/explorer/export/ExportStepper.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';
  import { filters } from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  import { stepperState } from '$lib/stores/Stepper';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import Content from '$lib/components/Content.svelte';
  import { getQueryRequest } from '$lib/utilities/QueryBuilder';
  import type { ExportInterface } from '$lib/models/Export';
  import { features } from '$lib/stores/Configuration';
  let { exports } = ExportStore;

  let queryRequest: QueryRequestInterface = getQueryRequest(true);
  let exportRows: ExportRowInterface[] = $exports.map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.conceptPath,
      variableName: exp.display || exp.searchResult?.display || exp.searchResult?.name,
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
  if ($features.useQueryTemplate) {
    const patientIdExport: ExportInterface = {
      id: '\\_Patient ID\\',
      conceptPath: '\\_Patient ID\\',
      display: 'Patient ID',
      searchResult: {
        conceptPath: '\\_Patient ID\\',
        name: '_Patient ID',
        dataset: '',
        display: 'Patient ID',
        studyAcronym: '',
        description: 'Patient identifier.',
        type: 'Categorical',
        allowFiltering: true,
      },
    };
    let patientIdRow: ExportRowInterface = {
      ref: patientIdExport,
      selected: true,
      variableId: patientIdExport.conceptPath,
      variableName: patientIdExport.display || patientIdExport.searchResult?.name,
      description: patientIdExport.searchResult?.description,
      type: patientIdExport.searchResult?.type,
    };
    exportRows.push(patientIdRow);
    if ($features.useQueryTemplate) {
      const topmedExport: ExportInterface = {
        id: '\\_Topmed Study Accession with Subject ID\\',
        conceptPath: '\\_Topmed Study Accession with Subject ID\\',
        display: 'TOPMed Study Accession with Subject ID',
        searchResult: {
          conceptPath: '\\_Topmed Study Accession with Subject ID\\',
          name: '_TOPMed Study Accession with Subject ID',
          dataset: 'TOPMed',
          display: 'TOPMed Study Accession with Subject ID',
          studyAcronym: 'TOPMed',
          description: 'TOPMed study accession number and subject identifier.',
          type: 'Categorical',
          allowFiltering: true,
        },
      };
      let topMedRow: ExportRowInterface = {
        ref: topmedExport,
        selected: true,
        variableId: topmedExport.conceptPath,
        variableName: topmedExport.display || topmedExport.searchResult?.name,
        description: topmedExport.searchResult?.description,
        type: topmedExport.searchResult?.type,
      };
      exportRows.push(topMedRow);

      const parentStudyExport: ExportInterface = {
        id: '\\_Parent Study Accession with Subject ID\\',
        conceptPath: '\\_Parent Study Accession with Subject ID\\',
        display: 'Parent Study Accession with Subject ID',
        searchResult: {
          conceptPath: '\\_Parent Study Accession with Subject ID\\',
          name: '_Parent Study Accession with Subject ID',
          dataset: '',
          display: 'Parent Study Accession with Subject ID',
          studyAcronym: '',
          description: 'Parent study accession number and subject identifier.',
          type: 'Categorical',
          allowFiltering: true,
        },
      };
      let parentStudyRow: ExportRowInterface = {
        ref: parentStudyExport,
        selected: true,
        variableId: parentStudyExport.conceptPath,
        variableName: parentStudyExport.display || parentStudyExport.searchResult?.name,
        description: parentStudyExport.searchResult?.description,
        type: parentStudyExport.searchResult?.type,
      };
      exportRows.push(parentStudyRow);
    }
  }
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
  {#if $exports.length > 0 || $filters.length > 0}
    <section class="flex justify-center items-center w-full h-full mt-8">
      <ExportStepper query={queryRequest} rows={[...filterRows, ...exportRows]} />
    </section>
  {:else}
    <div class="flex flex-col items-center justify-center m-8">
      <p>No filters or exports have been created.</p>
      <div class="flex gap-4">
        <button
          class="btn preset-filled-primary-500 m-4"
          onclick={() => {
            alert('This would start the tour at some step');
          }}>Learn How</button
        >
      </div>
    </div>
  {/if}
</Content>

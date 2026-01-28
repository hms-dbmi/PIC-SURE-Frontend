<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import { features } from '$lib/configuration';
  import { exports, addExports, removeExports } from '$lib/stores/Export';
  import type { ExportInterface } from '$lib/models/Export';
  import type { ExportRowInterface } from '$lib/models/ExportRow';
  import { searchDictionary } from '$lib/stores/Dictionary';
  import { QueryV3 } from '$lib/models/query/Query';
  import * as api from '$lib/api';
  import { Picsure } from '$lib/paths';
  import { toaster } from '$lib/toaster';
  import { resources, loadResources } from '$lib/stores/Resources';
  import { genericUUID } from '$lib/utilities/UUID';

  import Summary from './Summary.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';

  export interface PrepareProps {
    query: QueryRequestInterfaceV3;
    rows: ExportRowInterface[];
    preparePromise: Promise<void>;
    dataLimitExceeded: boolean;
  }

  let { query, rows, dataLimitExceeded }: PrepareProps = $props();

  const columns = [
    { dataElement: 'name', label: 'Variable Name', sort: true },
    { dataElement: 'description', label: 'Variable Description', sort: true },
    { dataElement: 'type', label: 'Type', sort: true, class: 'text-center' },
  ];

  let activeRows: ExportRowInterface[] = $derived(rows);
  let loadingSampleIds = $state(false);
  let sampleIds = $state(false);
  let lastExports: ExportRowInterface[] = $state([]);
  let checkingSampleIds = $state(false);

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
  });

  async function getGenomicConcepts() {
    await loadResources();
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
    const crossCountQuery = new QueryV3(structuredClone($state.snapshot(query).query));
    crossCountQuery.expectedResultType = 'CROSS_COUNT';
    const crossCountFields = concepts.content.map((concept) => concept.conceptPath);
    crossCountQuery.select = crossCountFields;

    const crossCountResponse: Record<string, number> = await api.post(Picsure.QueryV3Sync, {
      query: crossCountQuery,
      resourceUUID: $resources.hpdsAuth,
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
            id: genericUUID(),
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
</script>

<div id="first-step-container" class="flex flex-col w-full h-full items-center">
  <Summary />
  <section class="w-full">
    {#if dataLimitExceeded}
      <ErrorAlert
        data-testid="landing-error"
        title="Warning"
        color="warning"
        closeText="Back"
        onclose={() => goto('/explorer')}
      >
        Warning: Your selected data exceeds 1,000,000 estimated data points, which is too large to
        export. Please reduce the data selection or the number of selected participants.
      </ErrorAlert>
    {:else if !loadingSampleIds}
      <Datatable tableName="ExportSummary" data={activeRows} {columns} />
      {#if features.explorer.enableSampleIdCheckbox}
        <div>
          <label for="sample-ids-checkbox" class="flex items-center" data-testid="sample-ids-label">
            {#if checkingSampleIds}
              <Loading size="micro" ring />
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
  </section>
</div>

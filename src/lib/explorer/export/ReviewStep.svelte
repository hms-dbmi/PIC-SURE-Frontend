<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import { config } from '#lib/config/config.svelte.ts';
  import {
    exports,
    addExports,
    removeExports,
    mapSearchResultAsExport,
  } from '#lib/explorer/export/Export.ts';
  import type { ExportInterface } from '#lib/explorer/export/types.ts';
  import type { ExportRowInterface } from '#lib/explorer/export/ExportRow.ts';
  import { searchDictionary } from '#lib/explorer/Dictionary.ts';
  import { parseQuery } from '#lib/query/query.ts';
  import { buildRequest } from '#lib/query/build.ts';
  import { runCrossCount } from '#lib/api/picsure/query.ts';
  import { toaster } from '#lib/ui/toaster.ts';

  import Summary from './Summary.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ClientTable from '#lib/ui/datatable/ClientTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import type { QueryRequest } from '#lib/api/picsure/query.types.ts';

  export interface PrepareProps {
    query: QueryRequest;
    rows: ExportRowInterface[];
    preparePromise: Promise<void>;
    dataLimitExceeded: boolean;
    maxDataPoints: number;
  }

  let { query, rows, dataLimitExceeded, maxDataPoints }: PrepareProps = $props();

  const columns: Column<ExportRowInterface>[] = [
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
    const crossCountFields = concepts.content.map((concept) => concept.conceptPath);
    const { phenotypicClause, genomicFilters } = parseQuery($state.snapshot(query).query);
    const crossCountRequest = buildRequest(
      { phenotypicClause, genomicFilters },
      'CROSS_COUNT',
      (crossCountQuery) => ({ ...crossCountQuery, select: crossCountFields }),
    );

    const crossCountResponse = await runCrossCount(crossCountRequest);

    // Filter and return only concepts with counts > 0
    return concepts.content.filter((concept) => crossCountResponse[concept.conceptPath] > 0);
  }

  async function toggleSampleIds() {
    log(createLog('EXPORT', 'export.toggle_sample_id', { included: sampleIds }));
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
      const newExports = genomicConcepts.map(mapSearchResultAsExport);

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

<div id="export-review-step" class="flex flex-col w-full h-full items-center">
  <Summary />
  <section class="w-full">
    {#if dataLimitExceeded}
      <ErrorAlert
        data-testid="export-review-error"
        title="Warning"
        color="warning"
        closeText="Back"
        onclose={() => goto(resolve('explorer'))}
      >
        Warning: Your selected data exceeds {maxDataPoints.toLocaleString('en-US')} estimated data points,
        which is too large to export. Please reduce the data selection or the number of selected participants.
      </ErrorAlert>
    {:else if !loadingSampleIds}
      <ClientTable
        tableName="ExportSummary"
        data-testid="export-summary-table"
        id="export-summary-table"
        ariaLabel="Export summary"
        rows={activeRows}
        {columns}
      />
      {#if config.features.explorer.enableSampleIdCheckbox}
        <div>
          <label
            for="export-sample-ids"
            class="flex items-center"
            data-testid="export-sample-ids-label"
          >
            {#if checkingSampleIds}
              <Loading size="micro" ring />
            {:else}
              <input
                type="checkbox"
                class="mr-1"
                data-testid="export-sample-ids-checkbox"
                id="export-sample-ids"
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

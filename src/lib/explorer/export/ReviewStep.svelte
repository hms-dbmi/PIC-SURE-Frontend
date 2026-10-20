<script lang="ts">
  import { onMount } from 'svelte';

  import { config } from '#lib/config/config.svelte.ts';
  import { exportState, mapSearchResultAsExport } from '#lib/explorer/export/export.svelte.ts';
  import type { ExportInterface } from '#lib/explorer/export/types.ts';
  import type { ExportRowInterface } from '#lib/explorer/export/ExportRow.ts';
  import { searchDictionary } from '#lib/explorer/Dictionary.ts';
  import { parseQuery } from '#lib/query/query.ts';
  import { buildRequest } from '#lib/query/build.ts';
  import { runCrossCount } from '#lib/api/picsure/query.ts';
  import { toaster } from '#lib/ui/toaster.ts';

  import Summary from './Summary.svelte';
  import DataLimitWarning from './DataLimitWarning.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ClientTable from '#lib/ui/datatable/ClientTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import type { QueryRequest } from '#lib/api/picsure/query.types.ts';

  interface Props {
    query: QueryRequest;
    rows: ExportRowInterface[];
  }

  let { query, rows }: Props = $props();

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
    const exportedSampleIds = exportState.variables.filter((e: ExportInterface) =>
      e.conceptPath.includes('SAMPLE_ID'),
    );
    if (exportedSampleIds.length === 0) return;
    checkingSampleIds = true;
    try {
      const genomicConcepts = await getGenomicConcepts();
      const matchingSampleIds = exportedSampleIds.filter((sampleId) =>
        genomicConcepts.some((concept) => concept.conceptPath === sampleId.conceptPath),
      );
      sampleIds = genomicConcepts.length > 0 && matchingSampleIds.length === genomicConcepts.length;
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
    } catch (error) {
      // The box stays unticked; ticking it runs the lookup again and reports a failure.
      console.error('Error checking the exported sample IDs', error);
    } finally {
      checkingSampleIds = false;
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
        exportState.removeAll(exportsToRemove || []);
        activeRows = activeRows.filter(
          (r) => !lastExports.some((le) => le.variableId === r.variableId),
        );
        return;
      }

      const genomicConcepts = await getGenomicConcepts();

      // Create new exports for each concept
      const newExports = genomicConcepts.map(mapSearchResultAsExport);

      // Add exports and create corresponding rows
      exportState.addAll(newExports);
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
    <!-- The table and the sample-ID box stay, so ticking the box can be undone. -->
    {#if exportState.dataLimitExceeded}
      <DataLimitWarning data-testid="export-review-error" />
    {/if}
    {#if !loadingSampleIds}
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

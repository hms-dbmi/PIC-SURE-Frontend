<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import Loading from '$lib/components/Loading.svelte';
  import ShowMoreButton from '$lib/components/buttons/ShowMoreButton.svelte';
  import { branding } from '$lib/configuration';

  type InfoRow = {
    label: string;
    value: string;
    isMeta?: boolean;
    layout?: 'top' | 'stacked';
  };

  const MAX_INFO_ROWS = 10;

  let { data = {} as SearchResult }: { data?: SearchResult } = $props();

  let showAllVariableInfo = $state(false);
  let showAllDatasetInfo = $state(false);
  let showAllStudyInfo = $state(false);

  let detailPromise = $derived(getConceptDetails(data.conceptPath, data.dataset));

  function isPresent(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  function formatValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return String(value);
  }

  function addRow(
    rows: InfoRow[],
    label: string,
    value: unknown,
    isMeta = false,
    layout: InfoRow['layout'] = 'stacked',
  ): void {
    if (isPresent(value)) rows.push({ label, value: formatValue(value), isMeta, layout });
  }

  function getMetaRows(meta: Record<string, unknown> | null | undefined): InfoRow[] {
    return Object.entries(meta ?? {}).reduce((rows, [label, value]) => {
      addRow(rows, label, value, true);
      return rows;
    }, [] as InfoRow[]);
  }

  function getVisibleRows(rows: InfoRow[], showAll: boolean): InfoRow[] {
    return showAll ? rows : rows.slice(0, MAX_INFO_ROWS);
  }

  function variableInfoRows(searchResultDetail: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    addRow(rows, 'Name', searchResultDetail.display, false, 'top');
    addRow(rows, 'Accession', searchResultDetail.name, false, 'top');
    addRow(rows, 'Type', searchResultDetail.type, false, 'top');
    addRow(rows, 'Description', searchResultDetail.description);
    return [...rows, ...getMetaRows(searchResultDetail.meta)];
  }

  function datasetInfoRows(table: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    addRow(rows, 'Name', table.display, false, 'top');
    addRow(rows, 'Accession', table.name, false, 'top');
    addRow(rows, 'Description', table.description);
    return [...rows, ...getMetaRows(table.meta)];
  }

  function studyInfoRows(searchResultDetail: SearchResult): InfoRow[] {
    const rows: InfoRow[] = [];
    const study = searchResultDetail.study;
    addRow(
      rows,
      'Study Name',
      study?.fullName || study?.display || study?.studyAcronym || searchResultDetail.studyAcronym,
    );
    addRow(rows, 'Study Accession', study?.ref);
    return [...rows, ...getMetaRows(study?.meta)];
  }
</script>

{#snippet rowContent(row: InfoRow)}
  <span class="font-bold whitespace-nowrap" class:capitalize={row.isMeta}>{row.label}:</span>
  <span class="min-w-0 break-words [overflow-wrap:anywhere]">{row.value}</span>
{/snippet}

{#snippet infoRows(rows: InfoRow[])}
  <div class="w-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-8 gap-y-1">
    {#each rows as row}
      <div
        class="min-w-0"
        class:lg:col-span-2={row.layout !== 'top' && !row.isMeta}
        class:2xl:col-span-3={row.layout !== 'top' && !row.isMeta}
      >
        <div class="grid max-w-full min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-1">
          {@render rowContent(row)}
        </div>
      </div>
    {/each}
  </div>
{/snippet}

<div class="card bg-surface-100 min-h-60 p-4">
  <div class="card-body">
    {#await detailPromise}
      <Loading ring size="medium" />
    {:then searchResultDetail}
      {@const variableRows = variableInfoRows(searchResultDetail)}
      <section data-testid="variable-info" class="flex flex-col w-full p-4">
        <h3 class="text-primary-500">
          {branding.explorePage.resultInfo?.variableHeader || 'Variable Information'}
        </h3>
        {@render infoRows(getVisibleRows(variableRows, showAllVariableInfo))}
        {#if variableRows.length > MAX_INFO_ROWS}
          <ShowMoreButton
            data-testid="show-more-variable-info"
            expanded={showAllVariableInfo}
            onclick={() => (showAllVariableInfo = !showAllVariableInfo)}
          />
        {/if}
      </section>
      {#if searchResultDetail.table}
        {@const datasetRows = datasetInfoRows(searchResultDetail.table)}
        <section data-testid="dataset-info" class="flex flex-col w-full p-4">
          <h3 class="text-primary-500">
            {branding.explorePage.resultInfo?.datasetHeader || 'Dataset Information'}
          </h3>
          {@render infoRows(getVisibleRows(datasetRows, showAllDatasetInfo))}
          {#if datasetRows.length > MAX_INFO_ROWS}
            <ShowMoreButton
              data-testid="show-more-dataset-info"
              expanded={showAllDatasetInfo}
              onclick={() => (showAllDatasetInfo = !showAllDatasetInfo)}
            />
          {/if}
        </section>
      {/if}
      {#if searchResultDetail.study}
        {@const studyRows = studyInfoRows(searchResultDetail)}
        <section data-testid="study-info" class="flex flex-col w-full p-4">
          <h3 class="text-primary-500">
            {branding.explorePage.resultInfo?.studyHeader || 'Study Information'}
          </h3>
          {@render infoRows(getVisibleRows(studyRows, showAllStudyInfo))}
          {#if studyRows.length > MAX_INFO_ROWS}
            <ShowMoreButton
              data-testid="show-more-study-info"
              expanded={showAllStudyInfo}
              onclick={() => (showAllStudyInfo = !showAllStudyInfo)}
            />
          {/if}
        </section>
      {/if}
    {/await}
  </div>
</div>

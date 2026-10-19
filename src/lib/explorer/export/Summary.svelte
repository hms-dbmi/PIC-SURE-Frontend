<script lang="ts">
  import ExportStore from '#lib/explorer/export/Export.ts';
  import { onMount } from 'svelte';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { resultCountsState } from '#lib/query/counts/resultCounts.svelte.ts';
  import type { AnyRecordOfFilterInterface } from '#lib/query/filter.svelte.ts';

  let { exports } = ExportStore;

  let participantsCount = $derived(resultCountsState.total);
  let anyRecordsOfCount = $derived.by(() => {
    const anyRecordsOfFilters = filterState.all.filter(
      (filter) => filter.filterType === 'AnyRecordOf',
    ) as AnyRecordOfFilterInterface[];
    return (
      anyRecordsOfFilters.reduce((acc, filter) => acc + filter.concepts.length, 0) -
      anyRecordsOfFilters.length
    );
  });
  let variablesCount = $derived(filterState.all.length + $exports.length + anyRecordsOfCount);
  let dataPoints = $derived(
    typeof participantsCount === 'number' ? participantsCount * variablesCount : 0,
  );

  onMount(async () => {
    await resultCountsState.ensureLoaded(() => false);
  });
</script>

<div id="export-summary-stats" class="w-full flex justify-evenly mb-5 pb-2">
  <div id="export-summary" class="w-full grid grid-flow-col auto-cols-auto">
    <div class="text-xl">
      <label for="export-summary" class="mr-8 font-bold">Summary:</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="export-summary-participants" class="mr-2">{participantsCount}</span>
      <label for="export-summary-participants">Participants</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="export-summary-variables" class="mr-2">{variablesCount}</span>
      <label for="export-summary-variables">Variables</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="export-summary-data-points" class="mr-2">{dataPoints}</span>
      <label for="export-summary-data-points">Data Points</label>
    </div>
  </div>
</div>

<style>
  #export-summary-stats {
    border-bottom: 1px solid #888888;
  }
</style>

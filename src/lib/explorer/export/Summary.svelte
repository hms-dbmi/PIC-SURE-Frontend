<script lang="ts">
  import { onMount } from 'svelte';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import { resultCountsState } from '#lib/query/counts/resultCounts.svelte.ts';

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
      <span id="export-summary-participants" class="mr-2">{resultCountsState.total}</span>
      <label for="export-summary-participants">Participants</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="export-summary-variables" class="mr-2">{exportState.variableCount}</span>
      <label for="export-summary-variables">Variables</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="export-summary-data-points" class="mr-2">{exportState.dataPoints ?? 0}</span>
      <label for="export-summary-data-points">Data Points</label>
    </div>
  </div>
</div>

<style>
  #export-summary-stats {
    border-bottom: 1px solid #888888;
  }
</style>

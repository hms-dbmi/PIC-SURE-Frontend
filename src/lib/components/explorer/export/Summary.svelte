<script lang="ts">
  import ExportStore from '$lib/stores/Export';
  import { onMount } from 'svelte';
  import { allFilters } from '$lib/stores/Filter';
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import type { AnyRecordOfFilterInterface } from '$lib/models/Filter.svelte';

  let { exports } = ExportStore;

  let participantsCount = $derived(resultCountsState.total);
  let anyRecordsOfCount = $derived.by(() => {
    const anyRecordsOfFilters = $allFilters.filter(
      (filter) => filter.filterType === 'AnyRecordOf',
    ) as AnyRecordOfFilterInterface[];
    return (
      anyRecordsOfFilters.reduce((acc, filter) => acc + filter.concepts.length, 0) -
      anyRecordsOfFilters.length
    );
  });
  let variablesCount = $derived($allFilters.length + $exports.length + anyRecordsOfCount);
  let dataPoints = $derived(
    typeof participantsCount === 'number' ? participantsCount * variablesCount : 0,
  );

  onMount(async () => {
    // The export flow is authorized-only: the export page renders a login prompt
    // instead of the stepper when the user is logged out, and there is no
    // /discover/export route. Deriving this from deployment feature flags sent the
    // count through the open-access provider (POST /hpds/open/v3/query/sync as a
    // CROSS_COUNT), which 500s as soon as a genomic filter is in the query.
    await resultCountsState.ensureLoaded(() => false);
  });
</script>

<div id="stats" class="w-full flex justify-evenly mb-5 pb-2">
  <div id="summary" class="w-full grid grid-flow-col auto-cols-auto">
    <div class="text-xl">
      <label for="summary" class="mr-8 font-bold">Summary:</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="participants" class="mr-2">{participantsCount}</span>
      <label for="participants">Participants</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="variables" class="mr-2">{variablesCount}</span>
      <label for="variables">Variables</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="dataPoints" class="mr-2">{dataPoints}</span>
      <label for="dataPoints">Data Points</label>
    </div>
  </div>
</div>

<style>
  #stats {
    border-bottom: 1px solid #888888;
  }
</style>

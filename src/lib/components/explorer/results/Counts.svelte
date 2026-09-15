<script lang="ts">
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { countResult } from '$lib/services/counts/countFormat';
  import Loading from '$lib/components/Loading.svelte';

  const ERROR_VALUE = 'N/A';
  const LABEL = 'participants';

  let isLoading = $derived(resultCountsState.loading);
  let snapshot = $derived(resultCountsState.snapshot);
  let hasError = $derived(snapshot.summary.hasError);
  // Format the raw count, not summary.total — the latter is the numeric form
  // used by Summary/ExportStepper for arithmetic, and strips the ±N obfuscation
  // suffix that the backend returns on the open-access cross-count path.
  let count = $derived(countResult([snapshot.count]));
  let hasCount = $derived(snapshot.descriptorKey !== '' && !hasError);
</script>

<span class="flex items-baseline gap-2" data-testid="results-panel-count">
  {#if isLoading}
    <Loading ring size="mini" />
  {:else}
    <span id="result-count">
      {#if !hasCount}
        <span class="text-3xl font-bold">{ERROR_VALUE}</span>
      {:else}
        <span id="result-count-number" class="text-3xl font-bold">{count}</span>
      {/if}
    </span>
  {/if}
  <span class="text-lg">{LABEL}</span>
</span>

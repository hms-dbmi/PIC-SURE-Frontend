<script lang="ts">
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { countResult } from '$lib/services/counts/countFormat';

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
  // descriptorKey stays empty until a load commits, so "not loaded yet" and "load failed" are
  // distinct states; collapsing the first into ERROR_VALUE shows N/A on every server render.
  let isPending = $derived(isLoading || (!hasCount && !hasError));

  // The strip is a button named by its text. The spinner has none, so the count reaches
  // assistive technology through this span and the visual side is hidden from the tree.
  let accessibleCount = $derived(
    isPending
      ? 'Loading participant count'
      : hasError
        ? 'Participant count unavailable'
        : `${count} ${LABEL}`,
  );
</script>

<span class="flex items-baseline gap-2" data-testid="results-panel-count">
  <span class="sr-only">{accessibleCount}</span>
  <span id="result-count" class="text-3xl font-bold" aria-hidden="true">
    {#if isPending}
      <i class="fa-solid fa-spinner fa-spin text-xl align-middle"></i>
    {:else if hasError}
      {ERROR_VALUE}
    {:else}
      <span id="result-count-number">{count}</span>
    {/if}
  </span>
  <span class="text-lg" aria-hidden="true">{LABEL}</span>
</span>

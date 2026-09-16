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
  // An empty descriptorKey means no load has committed yet, which is not the same as one that
  // failed. It is the state of every server render - the summary panel is server-rendered now
  // that it no longer sits behind a closed-by-default panel - and of the window before the
  // first client load resolves. Reporting it as the error value flashed "N/A participants" on
  // the first paint of every open-access Explore visit.
  let isPending = $derived(isLoading || (!hasCount && !hasError));

  // The strip is a button, and ARIA treats a button's descendants as presentational - so the
  // count has to reach assistive technology as part of the button's name, which only text can
  // do. The visual side is hidden from the tree and this carries the same information.
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

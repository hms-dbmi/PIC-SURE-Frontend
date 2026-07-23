<script lang="ts">
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import { countResult } from '$lib/services/counts/countFormat';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { config } from '$lib/configuration.svelte';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  const ERROR_VALUE = 'N/A';
  const LABEL = 'Participants';

  let isLoading = $derived(resultCountsState.loading);
  let snapshot = $derived(resultCountsState.snapshot);
  let hasError = $derived(snapshot.summary.hasError);
  // Format the raw count, not summary.total — the latter is the numeric form
  // used by Summary/ExportStepper for arithmetic, and strips the ±N obfuscation
  // suffix that the backend returns on the open-access cross-count path.
  let count = $derived(countResult([snapshot.count]));
  let hasCount = $derived(snapshot.descriptorKey !== '' && !hasError);
</script>

<div class="flex flex-col items-center mt-2">
  {#if isLoading}
    <Loading ring size="mini" />
  {:else}
    <div id="result-count">
      {#if !hasCount}
        <span class="text-4xl font-bold">{ERROR_VALUE}</span>
      {:else}
        <div class="flex flex-row h-full">
          <span id="result-count-number" class="text-4xl">{count}</span>
        </div>
      {/if}
    </div>
  {/if}
  <h4 class="text-center">{LABEL}</h4>
</div>

{#if hasError && !isLoading}
  <ErrorAlert color="warning" iconSize="2xl">
    <p class="text-[0.6rem] !m-0">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(config.branding.explorePage.queryErrorText)}
    </p>
  </ErrorAlert>
{/if}

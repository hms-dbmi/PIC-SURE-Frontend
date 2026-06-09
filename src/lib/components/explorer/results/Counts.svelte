<script lang="ts">
  import { resultCountsState } from '$lib/state/resultCounts.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import { config } from '$lib/configuration.svelte';
  import { filters } from '$lib/stores/Filter';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  const ERROR_VALUE = 'N/A';
  const LABEL = 'Participants';

  let isLoading = $derived(resultCountsState.loading);
  let snapshot = $derived(resultCountsState.snapshot);
  let hasError = $derived(snapshot.summary.hasError);
  let count = $derived(snapshot.summary.total);
  let hasCount = $derived(snapshot.descriptorKey !== '');
</script>

<div class="flex flex-col items-center mt-2">
  {#if isLoading}
    <Loading ring size="mini" />
  {:else}
    <span id="result-count">
      {#if !hasCount}
        <span class="text-4xl font-bold">{ERROR_VALUE}</span>
      {:else}
        <div class="flex flex-row h-full">
          <span id="result-count-number" class="text-4xl">{count}</span>
          {#if hasError}
            <HelpInfoPopup
              type="exclamation"
              color="warning"
              id="result-count-error"
              text={$filters.length !== 0
                ? config.branding.explorePage.filterErrorText
                : config.branding.explorePage.queryErrorText}
            />
          {/if}
        </div>
      {/if}
    </span>
  {/if}
  <h4 class="text-center">{LABEL}</h4>
</div>

{#if hasError}
  <ErrorAlert color="warning" iconSize="2xl">
    <p class="text-[0.6rem] !m-0">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(config.branding.explorePage.queryErrorText)}
    </p>
  </ErrorAlert>
{/if}

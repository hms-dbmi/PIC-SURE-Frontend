<script lang="ts">
  import type { PatientCount, StatValue } from '$lib/models/Stat';
  import { resultCounts } from '$lib/stores/ResultStore';
  import { StatPromise } from '$lib/utilities/StatBuilder';
  import { countResult } from '$lib/utilities/PatientCount';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  const ERROR_VALUE = 'N/A';
  let showErrorMessage = $state(false);

  function countSettled(counts: PromiseSettledResult<StatValue>[]) {
    return countResult(counts.filter(StatPromise.fullfiled).map(({ value }) => value));
  }

  function hasErrorInCounts(counts: PromiseSettledResult<StatValue>[]) {
    return counts.filter(StatPromise.fullfiled).length === 0 || counts.some(StatPromise.rejected);
  }

  $effect(() => {
    showErrorMessage = false;
    $resultCounts.forEach((stat) => {
      Promise.allSettled(StatPromise.list(stat)).then((counts) => {
        if (hasErrorInCounts(counts)) {
          showErrorMessage = true;
        }
      });
    });
  });
</script>

{#each $resultCounts as stat}
  <div class="flex flex-col items-center mt-2">
    {#await Promise.allSettled(StatPromise.list(stat))}
      <Loading ring size="mini" />
    {:then counts}
      {@const count: PatientCount = countSettled(counts)}
      {@const hasError = hasErrorInCounts(counts)}
      <span id="result-count">
        {#if counts.filter(StatPromise.fullfiled).length === 0}
          <span class="sr-only">{ERROR_VALUE}</span>
          <span class="text-4xl font-bold">{ERROR_VALUE}</span>
        {:else}
          <div class="flex flex-row h-full">
            <span id="result-count-number" class="text-4xl">{count}</span>
            {#if hasError}
              <span id="result-count-error" class="text-xs ml-1 h-full !flex flex-col">
                <i
                  class="fa-solid fa-circle-exclamation text-warning-900-100 pt-[5px] hover:text-warning-400-600"
                  title="One or more sites had an error for this count."
                ></i>
                <span class="sr-only">One or more sites had an error for this count.</span>
              </span>
            {/if}
          </div>
        {/if}
      </span>
    {/await}
    <h4 class="text-center">{stat.label}</h4>
  </div>
{/each}

{#if showErrorMessage}
  <ErrorAlert color="warning" iconSize="2xl">
    <p class="text-[0.6rem] !m-0">
      Some sites did not return patient counts for your query. See
      <a href="/explorer/cohort" class="anchor font-bold">Cohort Details</a>
      for more information.
    </p>
  </ErrorAlert>
{/if}

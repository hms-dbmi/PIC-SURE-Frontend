<script lang="ts">
  import type { PatientCount, StatValue } from '$lib/models/Stat';
  import { resultCounts } from '$lib/stores/ResultStore';
  import { StatPromise } from '$lib/utilities/StatBuilder';
  import { countResult } from '$lib/utilities/PatientCount';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import HelpInfoPopup from '$lib/components/HelpInfoPopup.svelte';
  import { branding } from '$lib/configuration';
  import { filters } from '$lib/stores/Filter';
  import { get } from 'svelte/store';
  import { features } from '$lib/configuration';
  import { sanitizeHTML } from '$lib/utilities/HTML';

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
      Promise.allSettled(StatPromise.list(stat).map(({ promise }) => promise)).then(
        (counts: PromiseSettledResult<StatValue>[]) => {
          if (hasErrorInCounts(counts)) {
            showErrorMessage = true;
          }
        },
      );
    });
  });
</script>

{#each $resultCounts as stat}
  <div class="flex flex-col items-center mt-2">
    {#await Promise.allSettled(StatPromise.list(stat).map(({ promise }) => promise))}
      <Loading ring size="mini" />
    {:then counts}
      {@const count: PatientCount = countSettled(counts)}
      {@const hasError = hasErrorInCounts(counts)}
      <span id="result-count">
        {#if counts.filter(StatPromise.fullfiled).length === 0}
          <span class="text-4xl font-bold">{ERROR_VALUE}</span>
        {:else}
          <div class="flex flex-row h-full">
            <span id="result-count-number" class="text-4xl">{count}</span>
            {#if hasError}
              <HelpInfoPopup
                type="exclamation"
                color="warning"
                id="result-count-error"
                text={get(filters).length !== 0
                  ? branding?.explorePage?.filterErrorText
                  : branding?.explorePage?.queryErrorText}
              />
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
      {#if features.federated}
        Some sites did not return patient counts for your query. See
        <a href="/explorer/cohort" class="anchor font-bold">Cohort Details</a>
        for more information.
      {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sanitizeHTML(branding?.explorePage?.queryErrorText)}
      {/if}
    </p>
  </ErrorAlert>
{/if}

<script lang="ts">
  import type { PatientCount, StatValue } from '$lib/models/Stat';
  import { resultCounts } from '$lib/stores/ResultStore';
  import { StatPromise } from '$lib/utilities/StatBuilder';
  import { countResult } from '$lib/utilities/PatientCount';
  import Loading from '$lib/components/Loading.svelte';

  const ERROR_VALUE = 'N/A';

  function countSettled(counts: PromiseSettledResult<StatValue>[]) {
    return countResult(counts.filter(StatPromise.fullfiled).map(({ value }) => value));
  }
</script>

{#each $resultCounts as stat}
  <div class="flex flex-col items-center mt-2">
    {#await Promise.allSettled(StatPromise.list(stat))}
      <Loading ring size="mini" />
    {:then counts}
      {@const count: PatientCount = countSettled(counts)}
      <span id="result-count" class="text-4xl">
        {#if counts.filter(StatPromise.fullfiled).length === 0}
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span class="sr-only">{ERROR_VALUE}</span>
        {:else}
          {count}
          {#if counts.some(StatPromise.rejected)}
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span class="sr-only">{ERROR_VALUE}</span>
          {/if}
        {/if}
      </span>
    {/await}
    <h4 class="text-center">{stat.label}</h4>
  </div>
{/each}

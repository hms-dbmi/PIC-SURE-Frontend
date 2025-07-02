<script lang="ts">
  import type { PatientCount } from '$lib/types';
  import { resultCounts } from '$lib/stores/ResultStore';
  import { promiseList } from '$lib/utilities/StatBuilder';
  import { countResult } from '$lib/utilities/PatientCount';
  import Loading from '$lib/components/Loading.svelte';

  const ERROR_VALUE = 'N/A';

  function countSettled(counts: PromiseSettledResult<PatientCount>[]) {
    return countResult(
      counts.filter((count) => count.status === 'fulfilled').map((count) => count.value),
    );
  }
</script>

{#each $resultCounts as stat}
  <div class="flex flex-col items-center mt-2">
    {#await Promise.allSettled(promiseList(stat))}
      <Loading ring size="mini" />
    {:then counts}
      {@const count: PatientCount = countSettled(counts)}
      <span id="result-count" class="text-4xl">
        {#if counts.filter(({ status }) => status === 'fulfilled').length === 0}
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span class="sr-only">{ERROR_VALUE}</span>
        {:else}
          {count}
          {#if counts.some((count) => count.status === 'rejected')}
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span class="sr-only">{ERROR_VALUE}</span>
          {/if}
        {/if}
      </span>
    {/await}
    <h4 class="text-center">{stat.label}</h4>
  </div>
{/each}

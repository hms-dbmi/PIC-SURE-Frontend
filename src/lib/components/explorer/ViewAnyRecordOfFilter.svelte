<script lang="ts">
  import type { Filter, AnyRecordOfFilterInterface } from '$lib/models/Filter';

  let { filter }: { filter: Filter } = $props();
</script>

<div>
  <header>
    <h1 class="text-2xl font-bold">
      Variables in {filter.variableName} category
    </h1>
    <h2 class="text-lg font-normal">
      {`${(filter as AnyRecordOfFilterInterface)?.concepts?.length} variable(s) in ${filter.variableName} category`}
    </h2>
  </header>
  {#if filter.filterType === 'AnyRecordOf'}
    {#each filter.concepts as concept}
      <div>
        {concept}
      </div>
    {/each}
  {:else}
    No filter provided
  {/if}
</div>
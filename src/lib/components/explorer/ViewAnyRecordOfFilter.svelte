<script lang="ts">
  import type { Filter, AnyRecordOfFilterInterface } from '$lib/models/Filter';

  let { filter }: { filter: Filter } = $props();
</script>

<div>
  <header>
    <h1 class="text-lg font-normal">
      {`${(filter as AnyRecordOfFilterInterface)?.concepts?.length} variable(s) in ${filter.searchResult?.display || filter.searchResult?.name || filter.variableName} category`}
    </h1>
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
<script lang="ts">
  import type { Filter, AnyRecordOfFilterInterface } from '$lib/models/Filter';

  let { filter }: { filter: Filter } = $props();
</script>

<div>
  <header>
    <h2>
      Variables in {filter.variableName} category
    </h2>
    <h3>
      {`${(filter as AnyRecordOfFilterInterface)?.concepts?.length} variable(s) in ${filter.variableName} category`}
    </h3>
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

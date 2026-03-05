<script lang="ts">
  import {
    isFilterGroup,
    type Filter,
    type FilterGroupInterface,
  } from '$lib/models/Filter.svelte';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import ResultsFilterGroup from '$lib/components/explorer/results/ResultsFilterGroup.svelte';

  let { group, depth = 0 }: { group: FilterGroupInterface; depth?: number } = $props();
  let nested = $derived(depth > 0);
</script>

<div class="flex flex-col" class:border-l-3={nested} class:border-gray-400={nested} class:pl-2={nested} class:ml-1={nested}>
  {#each group.children as child, index}
    {#if index > 0}
      <span class="font-semibold text-xs py-0.5" data-testid="operator-label">{group.operator}</span>
    {/if}
    {#if isFilterGroup(child)}
      <ResultsFilterGroup group={child} depth={depth + 1} />
    {:else}
      <FilterComponent filter={child as Filter} />
    {/if}
  {/each}
</div>

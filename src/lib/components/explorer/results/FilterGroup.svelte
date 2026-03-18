<script lang="ts">
  import { isFilterGroup, type Filter, type FilterGroupInterface } from '$lib/models/Filter.svelte';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import OperatorDropdown from '$lib/components/explorer/results/OperatorDropdown.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';

  let { group = $bindable() }: { group: FilterGroupInterface } = $props();
  let id = $derived(group.uuid.split('-')[0]);
</script>

<div class={`filter-group-${group.operator.toLowerCase()}`} data-testid={`filter-group-${id}`}>
  {#key group.uuid}
    {#each group.children as child, index}
      {#if index > 0}
        <OperatorDropdown
          siblingA={group.children[index - 1]}
          siblingB={group.children[index]}
          operator={group.operator}
        />
      {/if}
      {#if isFilterGroup(child)}
        <FilterGroup group={child} />
      {:else}
        <FilterComponent filter={child as Filter} />
      {/if}
    {/each}
  {/key}
</div>

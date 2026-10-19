<script lang="ts">
  import { isFilterGroup, type FilterInterface } from '#lib/query/filter.svelte.ts';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import AdvancedItem from './AdvancedItem.svelte';
  import { markDragOverlay } from './FilterTreeEditor.svelte.ts';

  interface Props {
    node: FilterInterface;
  }

  let { node }: Props = $props();

  markDragOverlay();
</script>

{#if isFilterGroup(node)}
  <AdvancedGroup group={node} />
{:else}
  <AdvancedItem filter={node} />
{/if}

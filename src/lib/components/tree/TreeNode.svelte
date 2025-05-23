<script lang="ts">
  import type { TreeNodeInterface } from '$lib/components/tree/types';
  import TreeNode from '$lib/components/tree/TreeNode.svelte';

  const { node }: { node: TreeNodeInterface } = $props();
</script>

<details
  class="tree-item"
  data-testid="tree-item:{node.name}-{node.value}"
  aria-disabled={node.disabled}
  open={node.open}
>
  <summary
    class="tree-item-summary list-none [&amp;::-webkit-details-marker]:hidden flex items-center cursor-pointer space-x-4 rounded-container p-0 hover:preset-tonal-primary w-full"
    role="treeitem"
    aria-selected={node.allSelected}
    aria-expanded={node.open}
  >
    <button
      id="tree-item-btn:{node.name}-{node.value}"
      data-testid="tree-item-btn:{node.name}-{node.value}"
      title={!node.isLeaf ? `${node.open ? 'Close' : 'Open'} node` : undefined}
      name={node.name}
      type="button"
      class="m-1 ml-2"
      onclick={() => node.toggleOpen()}
      tabindex={node.isLeaf ? -1 : 0}
    >
      {#if !node.isLeaf}
        <i class="fa-solid fa-angle-{node.open ? 'up' : 'down'}"></i>
      {:else}
        <i class="fa-solid fa-minus"></i>
      {/if}
    </button>
    <input
      id="checkbox:{node.name}-{node.value}"
      data-testid="checkbox:{node.name}-{node.value}"
      class="checkbox tree-item-checkbox mr-1"
      type="checkbox"
      name={node.name}
      value={node.value}
      checked={node.allSelected}
      indeterminate={node.indeterminant}
      onclick={() => node.toggleSelected()}
    />
    <label
      for="{node.isLeaf ? 'checkbox:' : 'tree-item-btn:'}{node.name}-{node.value}"
      class="w-full">{node.value}</label
    >
  </summary>
  <div class="tree-item-children ml-4" data-testid="tree-item-children:{node.name}" role="group">
    {#if !node.isLeaf && node.open}
      {#each node.children as child}
        <TreeNode node={child} />
      {/each}
    {/if}
  </div>
</details>

<script lang="ts">
  import { css } from '#lib/utilities/style.ts';
  import type { RadioNodeInterface } from '#lib/components/tree/types.ts';
  import RadioTreeNode from '#lib/components/tree/RadioTreeNode.svelte';

  const {
    node,
    index,
    isRoot = false,
    disabled = false,
  }: { node: RadioNodeInterface; index: number; isRoot?: boolean; disabled?: boolean } = $props();
  const uid = $props.id();
</script>

<details
  class="tree-item"
  data-testid="ui-tree-item-{node.name}-{node.value}"
  aria-disabled={node.disabled || disabled}
  open
>
  <summary
    class="tree-item-summary list-none [&::-webkit-details-marker]:hidden flex items-center cursor-pointer rounded-container p-0 hover:preset-tonal-primary space-x-1 w-full mr-2"
    role="treeitem"
    aria-selected={node.selected}
    aria-expanded={true}
  >
    {#if !isRoot}
      <i
        class="fa-solid fa-angle-left fa-xl -rotate-45 self-center"
        {@attach css({ 'margin-left': `${(index + 1) * 9}px` })}
      ></i>
    {/if}
    <input
      id="{uid}-radio"
      aria-labelledby="{uid}-label"
      data-testid="ui-tree-radio-{node.name}"
      class="radio tree-item-radio self-center {isRoot ? 'ml-[28px]' : ''}"
      type="radio"
      name="tree-radio"
      value={node.value}
      disabled={node.disabled || disabled}
      checked={node.selected}
      onclick={() => node.select()}
    />
    <!-- A parent's name toggles its children (the summary's default), so only leaves forward clicks to the radio -->
    <label id="{uid}-label" for={node.isLeaf ? `${uid}-radio` : undefined} class="w-full"
      >{node.name}</label
    >
  </summary>
  <div class="tree-item-children ml-4" data-testid="ui-tree-children-{node.name}" role="group">
    {#if !node.isLeaf}
      {#each node.children as child}
        <RadioTreeNode node={child} index={index + 1} {disabled} />
      {/each}
    {/if}
  </div>
</details>

<script lang="ts" generics="T">
  import type { Attachment } from 'svelte/attachments';
  import Button from '#lib/ui/Button.svelte';
  import { css } from '#lib/ui/style.ts';
  import TreeItem from '#lib/ui/tree/TreeItem.svelte';
  import type { TreeModel, TreeNode } from '#lib/ui/tree/treeModel.svelte.ts';

  interface Props {
    model: TreeModel<T>;
    node: TreeNode<T>;
    register: (node: TreeNode<T>) => Attachment<HTMLElement>;
    /** Prefixes the item ids and groups the radios of one single-select tree. */
    treeId: string;
    posinset: number;
    setsize: number;
  }

  const { model, node, register, treeId, posinset, setsize }: Props = $props();

  const labelId = $derived(`${treeId}-${node.key}-label`);
  const radio = $derived(model.selection === 'single');

  const rowClass = {
    checkbox:
      'tree-item-summary flex items-center cursor-pointer space-x-4 rounded-container p-0 hover:preset-tonal-primary w-full',
    radio:
      'tree-item-summary flex items-center cursor-pointer rounded-container p-0 hover:preset-tonal-primary space-x-1 w-full mr-2',
  };
</script>

<div
  role="treeitem"
  class="tree-item outline-none [&:focus-visible>.tree-item-summary]:ring-2 [&:focus-visible>.tree-item-summary]:ring-primary-500"
  tabindex={model.tabStop === node ? 0 : -1}
  aria-labelledby={labelId}
  aria-level={node.level}
  aria-posinset={posinset}
  aria-setsize={setsize}
  aria-expanded={node.isLeaf ? undefined : node.open}
  aria-checked={node.checked}
  aria-disabled={node.allDisabled}
  aria-busy={node.loading || undefined}
  data-testid="ui-tree-item-{node.name}-{node.value}"
  onfocus={() => (model.active = node)}
  {@attach register(node)}
>
  <div class={rowClass[radio ? 'radio' : 'checkbox']}>
    {#if radio}
      {#if node.level > 1}
        <i
          class="fa-solid fa-angle-left fa-xl -rotate-45 self-center"
          {@attach css({ 'margin-left': `${node.level * 9}px` })}
        ></i>
      {/if}
      <input
        aria-labelledby={labelId}
        data-testid="ui-tree-radio-{node.name}"
        class="radio tree-item-radio self-center {node.level === 1 ? 'ml-[28px]' : ''}"
        type="radio"
        name={treeId}
        tabindex={-1}
        value={node.value}
        disabled={node.disabled}
        checked={node.selected}
        onclick={() => node.select()}
      />
    {:else}
      {#if node.isLeaf}
        <span class="m-1 ml-2" aria-hidden="true"><i class="fa-solid fa-minus"></i></span>
      {:else}
        <Button
          variant="none"
          size="none"
          class="m-1 ml-2"
          tabindex={-1}
          title="{node.open ? 'Close' : 'Open'} node"
          data-testid="ui-tree-toggle-{node.name}-{node.value}"
          disabled={!node.canToggle}
          onclick={() => node.toggleOpen()}
        >
          {#if node.hasLoading}
            <i class="fa-solid fa-spinner fa-spin"></i>
          {:else}
            <i class="fa-solid fa-angle-{node.open ? 'down' : 'right'}"></i>
          {/if}
        </Button>
      {/if}
      <input
        aria-labelledby={labelId}
        data-testid="ui-tree-checkbox-{node.name}-{node.value}"
        class="checkbox tree-item-checkbox mr-1"
        type="checkbox"
        tabindex={-1}
        name={node.name}
        value={node.value}
        checked={node.checked === true}
        indeterminate={node.checked === 'mixed'}
        disabled={node.allDisabled}
        onclick={() => node.toggleSelected()}
      />
    {/if}
    <span id={labelId} class="w-full">{node.label}</span>
    {#if node.error}
      <span class="text-error-500 text-sm ml-2" title={node.error}>
        <i class="fa-solid fa-exclamation-triangle"></i>
      </span>
    {/if}
  </div>
  {#if !node.isLeaf && node.open}
    <div class="tree-item-children ml-4" data-testid="ui-tree-children-{node.name}" role="group">
      {#if node.error}
        <div class="text-error-500 text-sm p-2">Error loading children: {node.error}</div>
      {:else}
        {#each node.children as child, index (child.key)}
          <TreeItem
            {model}
            node={child}
            {register}
            {treeId}
            posinset={index + 1}
            setsize={node.children.length}
          />
        {/each}
      {/if}
    </div>
  {/if}
</div>

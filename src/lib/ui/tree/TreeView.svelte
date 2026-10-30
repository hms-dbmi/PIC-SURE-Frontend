<script lang="ts" generics="T">
  import type { Attachment } from 'svelte/attachments';
  import TreeItem from '#lib/ui/tree/TreeItem.svelte';
  import {
    TreeModel,
    type TreeModelOptions,
    type TreeNode,
    type TreeNodeInit,
    type TreeSelection,
  } from '#lib/ui/tree/treeModel.svelte.ts';

  interface Props {
    /**
     * The tree is rebuilt, dropping its selection and expansion, when `nodes`, `selection`,
     * `loadChildren` or `expandOnSelect` change.
     */
    nodes: TreeNodeInit<T>[];
    /** The tree's accessible name. */
    label: string;
    selection?: TreeSelection;
    loadChildren?: TreeModelOptions<T>['loadChildren'];
    onselect?: (payload: T) => void;
    onunselect?: (payload: T) => void;
    expandOnSelect?: boolean;
    class?: string;
    'data-testid'?: string;
  }

  const {
    nodes,
    label,
    selection = 'multi',
    loadChildren,
    onselect,
    onunselect,
    expandOnSelect = false,
    class: className = '',
    'data-testid': testid,
  }: Props = $props();

  const treeId = $props.id();

  const model = $derived(
    new TreeModel<T>({
      nodes,
      selection,
      expandOnSelect,
      loadChildren,
      onselect: (payload) => onselect?.(payload),
      onunselect: (payload) => onunselect?.(payload),
    }),
  );

  // Each item's element, to move focus to it, and the way back, to find the node a click hit.
  const elements = new WeakMap<TreeNode<T>, HTMLElement>();
  const owners = new WeakMap<Element, TreeNode<T>>();
  const register =
    (node: TreeNode<T>): Attachment<HTMLElement> =>
    (element) => {
      elements.set(node, element);
      owners.set(element, node);
      return () => elements.delete(node);
    };

  // An item contains its children, so letting focus scroll would bring a whole open branch into
  // view; scroll just the item's own row instead.
  function focusNode(node: TreeNode<T>) {
    model.active = node;
    const item = elements.get(node);
    item?.focus({ preventScroll: true });
    item?.firstElementChild?.scrollIntoView?.({ block: 'nearest' });
  }

  function onkeydown(event: KeyboardEvent) {
    const node = model.active;
    if (!node || owners.get(event.target as Element) !== node) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    // Like a checkbox, a held key selects once.
    if (event.repeat && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      return;
    }
    const next = model.keydown(event.key, node);
    if (!next) return;
    event.preventDefault();
    if (next !== node) focusNode(next);
  }

  function onfocus(event: FocusEvent) {
    if (event.target === event.currentTarget && model.tabStop) focusNode(model.tabStop);
  }

  // A click on an item's row acts like one on its name: a parent opens or closes, a leaf toggles
  // its selection. The checkbox, radio and toggle button handle their own clicks.
  function onclick(event: MouseEvent) {
    const target = event.target as Element;
    const item = target.closest('[role="treeitem"]');
    const node = item && owners.get(item);
    if (!node || !item.firstElementChild?.contains(target)) return;
    if (!target.closest('input, button')) {
      if (!node.isLeaf) void node.toggleOpen();
      else if (node.canSelect) void node.toggleSelected();
    }
    focusNode(node);
  }
</script>

<!-- Svelte wants a tabindex on role=tree; -1 adds no tab stop, and focus that lands on the
     container (a click on its blank space) moves on to the tree's tab stop. -->
<div
  role="tree"
  aria-label={label}
  aria-multiselectable={selection === 'multi'}
  class={className}
  data-testid={testid}
  tabindex={-1}
  {onkeydown}
  {onclick}
  {onfocus}
>
  {#each model.roots as node, index (node.key)}
    <TreeItem
      {model}
      {node}
      {register}
      {treeId}
      posinset={index + 1}
      setsize={model.roots.length}
    />
  {/each}
</div>

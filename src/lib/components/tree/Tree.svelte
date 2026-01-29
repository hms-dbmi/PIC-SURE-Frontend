<script lang="ts">
  import type { TreeNodeInterface, NodeInterface } from '$lib/components/tree/types';
  import TreeNodeComponent from '$lib/components/tree/TreeNode.svelte';

  let {
    nodes = [],
    onselect = () => {},
    onunselect = () => {},
    fullWidth = false,
  }: {
    nodes: NodeInterface[];
    onselect?: (value: string) => void;
    onunselect?: (value: string) => void;
    fullWidth?: boolean;
  } = $props();

  class TreeNode implements TreeNodeInterface {
    name: string = '';
    value: string = '';
    open: boolean = $state(false);
    selected: boolean = $state(false);
    disabled: boolean = $state(false);
    children: TreeNodeInterface[] = $state([]);

    constructor(
      name: string,
      value: string,
      children: TreeNodeInterface[] = [],
      open: boolean = false,
      selected: boolean = false,
    ) {
      this.name = name;
      this.value = value;
      this.children = children;
      this.open = open;
      this.selected = selected;
    }

    isLeaf: boolean = $derived(this.children.length === 0);

    someSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return this.selected;
      return this.children.some((child: TreeNode) => child.someSelected);
    });

    someSelectedNotDisabled: boolean = $derived.by(() => {
      if (this.isLeaf || this.children.length === 0) return !this.disabled && this.selected;
      return this.children.some((child: TreeNode) => child.someSelectedNotDisabled);
    });

    allSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return this.selected;
      return this.children.every((child: TreeNode) => child.allSelected);
    });

    noneSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return !this.selected;
      return !this.someSelected;
    });

    indeterminant: boolean = $derived.by(() => {
      if (this.isLeaf) return false;
      return this.someSelectedNotDisabled && !this.allSelected;
    });

    select(): void {
      if (this.disabled) return;

      if (!this.isLeaf) {
        this.children.forEach((child) => child.select());
        this.open = true;
      } else {
        this.selected = true;
        onselect(this.value);
      }
    }

    unselect(): void {
      if (this.disabled) return;

      if (!this.isLeaf) {
        this.children.forEach((child) => child.unselect());
      } else {
        this.selected = false;
        onunselect(this.value);
      }
    }

    toggleSelected(): void {
      if (this.allSelected) {
        this.unselect();
      } else {
        this.select();
      }
    }

    toggleOpen(): void {
      if (this.isLeaf) return;
      this.open = !this.open;
    }
  }

  function mapNodeToTree(node: NodeInterface) {
    const { name, value, open, selected } = node;
    let children: TreeNode[] = [];
    let shouldOpen: boolean = open;
    if (node.children.length > 0) {
      children = node.children.map(mapNodeToTree);
      shouldOpen = children.some((child) => child.someSelected);
    }
    return new TreeNode(name, value, children, shouldOpen, selected);
  }

  let treeNodes: TreeNode[] = $state(nodes.map(mapNodeToTree));
</script>

<div class="overflow-auto h-[350.75px] {fullWidth ? 'w-full' : ''}">
  {#each treeNodes as treeNode}
    <TreeNodeComponent node={treeNode} />
  {/each}
</div>

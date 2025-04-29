<script lang="ts">
  import { onMount } from 'svelte';

  import type { TreeNodeInterface } from '$lib/models/TreeNode';
  import { selectedConsequence } from '$lib/stores/GeneFilter';
  import { addConsquence, removeConsequence } from '$lib/stores/GeneFilter';
  import variantData from '$lib/components/explorer/genome-filter/variant-data.json';
  import Node from '$lib/components/TreeNode.svelte';

  // Runes mode things like $state can only work in a svelte component
  class TreeNode implements TreeNodeInterface {
    name: string = '';
    value: string = '';
    open: boolean = $state(false);
    selected: boolean = $state(false);
    disabled: boolean = $state(false);
    children: TreeNode[] = $state([]);

    constructor(
      name: string,
      value: string,
      children: TreeNode[] = [],
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
      return this.someSelected && !this.allSelected;
    });

    select(): void {
      if (!this.isLeaf) {
        this.children.forEach((child) => child.select());
        this.open = true;
      } else {
        this.selected = true;
        addConsquence(this.value);
      }
    }

    unselect(): void {
      if (!this.isLeaf) {
        this.children.forEach((child) => child.unselect());
      } else {
        this.selected = false;
        removeConsequence(this.value);
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

  let severityNodes: TreeNode[] = $state([]);
  onMount(() => {
    severityNodes = variantData.map(({ key, children }) => {
      const childNodes = children.map(
        (child) => new TreeNode(key, child, [], false, $selectedConsequence.includes(child)),
      );
      const hasSelected = childNodes.some((child) => child.someSelected);
      return new TreeNode('severity', key, childNodes, hasSelected);
    });
  });
</script>

<div class="overflow-auto h-[350.75px]" role="tree">
  {#each severityNodes as node}
    <Node {node} />
  {/each}
</div>

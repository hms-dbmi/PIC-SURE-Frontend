<script lang="ts">
  import type { RadioNodeInterface, RadioNodeData } from '$lib/components/tree/types';
  import RadioTreeNode from './RadioTreeNode.svelte';

  let {
    nodes = [],
    onselect = () => {},
    fullWidth = false,
  }: {
    nodes: RadioNodeData[];
    onselect?: (value: string) => void;
    fullWidth: boolean;
  } = $props();

  class RadioNode implements RadioNodeInterface {
    name: string = '';
    value: string = '';
    selected: boolean = $state(false);
    disabled: boolean = $state(false);
    children: RadioNode[] = $state([]);

    constructor(
      name: string,
      value: string,
      children: RadioNode[] = [],
      selected: boolean = false,
    ) {
      this.name = name;
      this.value = value;
      this.children = children;
      this.selected = selected || this.isLeaf;
    }

    get isLeaf(): boolean {
      return this.children.length === 0;
    }

    select(): void {
      // Unselect all other nodes
      treeNodes.forEach((rootNode) => {
        const unselectNode = (node: RadioNode) => {
          if (node !== this) {
            node.selected = false;
            node.children.forEach(unselectNode);
          }
        };
        unselectNode(rootNode);
      });

      this.selected = true;
      onselect(this.value);
    }
  }

  function mapNodeToTree(node: RadioNodeData): RadioNode {
    const { name, value, selected } = node;
    let children: RadioNode[] = [];
    if (node.children.length > 0) {
      children = node.children.map(mapNodeToTree);
    }
    return new RadioNode(name, value, children, selected);
  }

  let treeNodes: RadioNode[] = $state(nodes.map(mapNodeToTree));
</script>

<div class={fullWidth ? 'w-full' : ''}>
  {#each treeNodes as treeNode, index}
    <RadioTreeNode node={treeNode} {index} isRoot={index === 0} />
  {/each}
</div>

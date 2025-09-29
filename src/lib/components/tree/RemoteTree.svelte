<script lang="ts">
  import type { TreeNodeInterface } from '$lib/components/tree/types';
  import type { SearchResult } from '$lib/models/Search';
  import RemoteTreeNodeComponent from '$lib/components/tree/RemoteTreeNode.svelte';
  import { onMount } from 'svelte';

  let {
    initialNodes = [],
    fetchChildren,
    onselect = () => {},
    onunselect = () => {},
    fullWidth = false,
    previousSelectedConcepts,
  }: {
    initialNodes: SearchResult[];
    fetchChildren: (conceptPath: string) => Promise<SearchResult[]>;
    onselect?: (value: string) => void;
    onunselect?: (value: string) => void;
    fullWidth: boolean;
    previousSelectedConcepts: string[];
  } = $props();

  class RemoteTreeNodeClass implements TreeNodeInterface {
    name: string = '';
    value: string = '';
    conceptPath: string = '';
    open: boolean = $state(false);
    selected: boolean = $state(false);
    disabled: boolean = $state(false);
    children: RemoteTreeNodeClass[] = $state([]);
    loading: boolean = $state(false);
    error: string | null = $state(null);
    isLeaf: boolean = $state(false);
    childrenLoaded: boolean = $state(false);

    constructor(apiNode: SearchResult) {
      this.name = apiNode.name;
      this.value = apiNode.name; // Using name as value, adjust if needed
      this.conceptPath = apiNode.conceptPath;
      this.isLeaf = false;
      this.children = apiNode?.children?.map((child) => new RemoteTreeNodeClass(child)) ?? [];

      // For leaf nodes, mark as loaded since they won't have children
      if (this.isLeaf) {
        this.childrenLoaded = true;
      }
    }

    someSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return this.selected;
      return this.children.some(
        (child: RemoteTreeNodeClass) => child.someSelected || child.selected,
      );
    });

    allSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return this.selected;
      if (this.children.length === 0) return this.selected;
      return this.children.every((child: RemoteTreeNodeClass) => child.allSelected);
    });

    noneSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return !this.selected;
      return !this.someSelected;
    });

    indeterminant: boolean = $derived.by(() => {
      if (this.isLeaf) return false;
      if (this.children.length === 0) return false;
      return this.someSelected && !this.allSelected;
    });

    async select(): Promise<void> {
      if (!this.isLeaf) {
        // Load children first if they haven't been loaded
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        // Now select all children
        if (this.children.length > 0) {
          await Promise.all(this.children.map((child) => child.select()));
        } else {
          onselect(this.conceptPath);
          this.selected = true;
        }
      } else {
        onselect(this.conceptPath);
        this.selected = true;
      }
    }

    async unselect(): Promise<void> {
      if (!this.isLeaf) {
        // Load children first if they haven't been loaded to ensure we can unselect them
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        await Promise.all(this.children.map((child) => child.unselect()));
      } else {
        this.selected = false;
        onunselect(this.conceptPath);
      }
    }

    async toggleSelected(): Promise<void> {
      if (this.allSelected) {
        await this.unselect();
      } else {
        await this.select();
      }
    }

    async toggleOpen(): Promise<void> {
      if (this.isLeaf) return;

      if (!this.open) {
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        this.open = true;
      } else {
        this.open = false;
      }
    }

    private async loadChildren(): Promise<void> {
      if (this.loading || this.childrenLoaded || this.isLeaf) return;

      this.loading = true;
      this.error = null;

      try {
        const childrenData = await fetchChildren(this.conceptPath);
        this.children = childrenData.map((child) => new RemoteTreeNodeClass(child));
        this.childrenLoaded = true;
        this.isLeaf = this.children.length === 0;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load children';
        console.error('Error loading children for', this.conceptPath, err);
      } finally {
        this.loading = false;
      }
    }
  }

  let treeNodes: RemoteTreeNodeClass[] = $state(
    initialNodes?.map((node) => new RemoteTreeNodeClass(node)) ?? undefined,
  );

  function updateNodeSelection(node: RemoteTreeNodeClass, selectedConcepts: string[]): void {
    if (node.isLeaf) {
      node.selected = selectedConcepts.includes(node.conceptPath);
    } else {
      // Only process children if they exist (have been loaded)
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => updateNodeSelection(child, selectedConcepts));

        // If any children are selected, expand this node to show them
        const hasSelectedChildren = node.children.some(
          (child) => child.selected || child.someSelected,
        );
        if (hasSelectedChildren) {
          node.open = true;
        }

        // Update parent selection state - check if all children are selected
        node.selected = node.children.every((child) => child.selected);
      } else {
        // No children loaded yet, check if this node itself is selected
        node.selected = selectedConcepts.includes(node.conceptPath);
      }
    }
  }

  onMount(() => {
    // Initialize tree with pre-selected concepts (only once during mount)
    if (treeNodes && previousSelectedConcepts && previousSelectedConcepts.length > 0) {
      treeNodes.forEach((node) => {
        updateNodeSelection(node, previousSelectedConcepts);
      });
    }
  });
</script>

<div class="overflow-auto {fullWidth ? 'w-full' : ''}">
  {#each treeNodes as treeNode}
    <RemoteTreeNodeComponent node={treeNode} />
  {/each}
</div>

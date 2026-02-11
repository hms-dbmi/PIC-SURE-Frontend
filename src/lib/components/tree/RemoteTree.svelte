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
    selectedConcepts,
    disabledConcepts = [],
  }: {
    initialNodes: SearchResult[];
    fetchChildren: (conceptPath: string) => Promise<SearchResult[] | undefined | null>;
    onselect?: (searchResult?: SearchResult) => void;
    onunselect?: (searchResult?: SearchResult) => void;
    fullWidth: boolean;
    selectedConcepts: string[];
    disabledConcepts: string[];
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
    searchResult?: SearchResult = $state(undefined);

    constructor(apiNode: SearchResult) {
      this.name = apiNode.name;
      this.value = apiNode.name; // Using name as value, adjust if needed
      this.conceptPath = apiNode.conceptPath;
      this.searchResult = apiNode;

      if (apiNode.children === undefined || apiNode.children === null) {
        this.isLeaf = true;
      } else if (apiNode.children.length > 0) {
        this.children = apiNode.children.map((child) => new RemoteTreeNodeClass(child));
        this.childrenLoaded = true;
      }
    }

    allchildrenLoaded: boolean = $derived.by(() => {
      if (this.isLeaf) return true;
      return this.childrenLoaded && this.children.every((child) => child.allchildrenLoaded);
    });

    hasLoading: boolean = $derived.by(() => {
      if (this.isLeaf) return this.loading;
      return this.loading || this.children.some((child) => child.hasLoading);
    });

    someSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return this.selected;
      return this.children.some(
        (child: RemoteTreeNodeClass) => child.someSelected || child.selected,
      );
    });

    allSelected: boolean = $derived.by(() => {
      if (this.isLeaf || this.children.length === 0) return this.selected;
      return this.children.every((child: RemoteTreeNodeClass) => child.allSelected);
    });

    noneSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return !this.selected;
      return !this.someSelected;
    });

    indeterminant: boolean = $derived.by(() => {
      if (this.isLeaf || this.children.length === 0) return false;
      return this.someSelected && !this.allSelected;
    });

    allDisabled: boolean = $derived.by(() => {
      if (this.children.length === 0) return this.disabled;
      return this.children.every((child: RemoteTreeNodeClass) => child.allDisabled);
    });

    async select(): Promise<void> {
      if (this.disabled) return;

      if (!this.isLeaf) {
        // Load children first if they haven't been loaded
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        // Now select all children
        if (this.children.length > 0) {
          await Promise.all(this.children.map((child) => child.select()));
        } else {
          onselect(this.searchResult);
          this.selected = true;
        }
      } else {
        onselect(this.searchResult);
        this.selected = true;
      }
    }

    async unselect(): Promise<void> {
      if (this.disabled) return;

      if (!this.isLeaf) {
        // Load children first if they haven't been loaded to ensure we can unselect them
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        // Now unselect all children
        if (this.children.length > 0) {
          await Promise.all(this.children.map((child) => child.unselect()));
        } else {
          this.selected = false;
          onunselect(this.searchResult);
        }
      } else {
        this.selected = false;
        onunselect(this.searchResult);
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
      if (this.loading || this.allchildrenLoaded || this.isLeaf || this.disabled) return;

      this.loading = true;
      this.error = null;

      try {
        const childrenData = await fetchChildren(this.conceptPath);
        this.isLeaf =
          childrenData === undefined || childrenData === null || childrenData.length === 0;
        this.children = childrenData?.map((child) => new RemoteTreeNodeClass(child)) || [];
        this.childrenLoaded = true;
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
    node.selected = selectedConcepts.some((concept) => node.conceptPath.startsWith(concept));

    if (!node.isLeaf && node.children && node.children.length > 0) {
      node.children.forEach((child) => updateNodeSelection(child, selectedConcepts));

      // If any children are selected, expand this node to show them
      const hasSelectedChildren = node.children.some(
        (child) => child.selected || child.someSelected,
      );

      // Update parent selection state - check if all children are selected
      const allSelected = node.children.every((child) => child.selected);
      node.selected = allSelected;
      node.open = !allSelected && hasSelectedChildren;
    }
  }

  function updateDisabledNodes(node: RemoteTreeNodeClass, disabledConcepts: string[]): void {
    node.disabled = disabledConcepts.some((concept) => node.conceptPath.startsWith(concept));

    if (!node.isLeaf && node.children && node.children.length > 0) {
      node.children.forEach((child) => updateDisabledNodes(child, disabledConcepts));
    }
  }

  onMount(() => {
    // Initialize tree with pre-selected concepts (only once during mount)
    treeNodes.forEach((node) => {
      if (selectedConcepts && selectedConcepts.length > 0) {
        updateNodeSelection(node, selectedConcepts);
      }
      if (disabledConcepts && disabledConcepts.length > 0) {
        updateDisabledNodes(node, disabledConcepts);
      }
    });
  });
</script>

<div class="overflow-auto {fullWidth ? 'w-full' : ''}">
  {#each treeNodes as treeNode}
    <RemoteTreeNodeComponent node={treeNode} />
  {/each}
</div>

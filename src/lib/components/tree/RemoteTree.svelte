<script lang="ts">
  import type { TreeNodeInterface } from '$lib/components/tree/types';
  import type { SearchResult } from '$lib/models/Search';
  import RemoteTreeNodeComponent from '$lib/components/tree/RemoteTreeNode.svelte';

  let {
    initialNodes = [],
    fetchChildren,
    onselect = () => {},
    onunselect = () => {},
    fullWidth = false,
  }: {
    initialNodes: SearchResult[];
    fetchChildren: (conceptPath: string) => Promise<SearchResult[]>;
    onselect?: (value: string) => void;
    onunselect?: (value: string) => void;
    fullWidth: boolean;
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
      return this.children.some((child: RemoteTreeNodeClass) => child.someSelected);
    });

    allSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return this.selected;
      if (this.children.length === 0) return false;
      return this.children.every((child: RemoteTreeNodeClass) => child.allSelected);
    });

    noneSelected: boolean = $derived.by(() => {
      if (this.isLeaf) return !this.selected;
      return !this.someSelected;
    });

    indeterminant: boolean = $derived.by(() => {
      if (this.isLeaf) return false;
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
          this.children.forEach((child) => child.select());
        } else {
          onselect(this.conceptPath);
          this.selected = true;
        }
        this.open = true;
      }
    }

    async unselect(): Promise<void> {
      if (!this.isLeaf) {
        // Load children first if they haven't been loaded to ensure we can unselect them
        if (!this.childrenLoaded) {
          await this.loadChildren();
        }
        this.children.forEach((child) => child.unselect());
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
</script>

<div class="overflow-auto {fullWidth ? 'w-full' : ''}">
  {#each treeNodes as treeNode}
    <RemoteTreeNodeComponent node={treeNode} />
  {/each}
</div>

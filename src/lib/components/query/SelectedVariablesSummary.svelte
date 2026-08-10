<script lang="ts">
  import type { ExportInterface } from '$lib/models/Export';

  let { exports = [] }: { exports: ExportInterface[] } = $props();
  let paths = $derived(exports.map(({ conceptPath }) => conceptPath));

  type PathNode = {
    label: string;
    children: PathNode[];
  };

  function getOrCreateNode(nodes: PathNode[], label: string): PathNode {
    const existingNode = nodes.find((node) => node.label === label);
    if (existingNode) return existingNode;

    const newNode = { label, children: [] };
    nodes.push(newNode);
    return newNode;
  }

  function buildTree(paths: string[]): PathNode[] {
    const root: PathNode[] = [];
    for (const path of paths) {
      const parts = path.split('\\').filter(Boolean);
      let level = root;
      for (const part of parts) {
        const node = getOrCreateNode(level, part);
        level = node.children;
      }
    }
    return root;
  }

  const tree = $derived(buildTree(paths));
</script>

{#snippet nodeChildren(children: PathNode[])}
  {@const leaves = children.filter((n) => n.children.length === 0)}
  {@const branches = children.filter((n) => n.children.length > 0)}

  {#if leaves.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each leaves as node}
        <span class="bg-surface-200 text-surface-800 text-xs rounded px-2 py-1">
          {node.label}
        </span>
      {/each}
    </div>
  {/if}

  {#each branches as node}
    <div class="mt-1.5">
      <p class="text-xs font-semibold text-surface-600 m-0">{node.label}</p>
      <div class="pl-3 border-l border-surface-300">
        {@render nodeChildren(node.children)}
      </div>
    </div>
  {/each}
{/snippet}

{#if paths.length === 0}
  <p class="text-sm text-surface-700">No additional variables</p>
{:else}
  {@const rootLeaves = tree.filter((n) => n.children.length === 0)}
  {@const rootBranches = tree.filter((n) => n.children.length > 0)}

  {#if rootLeaves.length > 0}
    <div class="flex flex-wrap gap-1.5 mb-3">
      {#each rootLeaves as node}
        <span class="bg-surface-200 text-surface-800 text-xs rounded px-2 py-1">
          {node.label}
        </span>
      {/each}
    </div>
  {/if}

  {#each rootBranches as node}
    <div class="mt-1.5">
      <p class="text-sm font-semibold text-surface-700 mx-0 mb-0">{node.label}</p>
      <div class="pl-3 border-l-2 border-surface-300 mt-1">
        {@render nodeChildren(node.children)}
      </div>
    </div>
  {/each}
{/if}

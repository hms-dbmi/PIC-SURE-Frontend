<script lang="ts">
  let { paths }: { paths: string[] } = $props();

  type PathNode = {
    label: string;
    children: Map<string, PathNode>;
  };

  function buildTree(paths: string[]): Map<string, PathNode> {
    const root = new Map<string, PathNode>();
    for (const path of paths) {
      const parts = path.split('\\').filter(Boolean);
      let level = root;
      for (const part of parts) {
        if (!level.has(part)) {
          level.set(part, { label: part, children: new Map() });
        }
        level = level.get(part)!.children;
      }
    }
    return root;
  }

  const tree = $derived(buildTree(paths));
</script>

{#snippet nodeChildren(children: Map<string, PathNode>)}
  {@const entries = [...children.values()]}
  {@const leaves = entries.filter((n) => n.children.size === 0)}
  {@const branches = entries.filter((n) => n.children.size > 0)}

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

<section data-testid="detail-variables-container" class="my-4">
  <h2 class="text-left h4 mb-2 mt-6">Variables Included in Dataset</h2>
  {#if paths.length === 0}
    <p class="text-sm text-surface-700">No additional variables</p>
  {:else}
    {@const entries = [...tree.values()]}
    {@const rootLeaves = entries.filter((n) => n.children.size === 0)}
    {@const rootBranches = entries.filter((n) => n.children.size > 0)}

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
      <div>
        <p class="text-sm font-semibold text-surface-700 mx-0 mb-0">{node.label}</p>
        <div class="pl-3 border-l-2 border-surface-300 mt-1">
          {@render nodeChildren(node.children)}
        </div>
      </div>
    {/each}
  {/if}
</section>

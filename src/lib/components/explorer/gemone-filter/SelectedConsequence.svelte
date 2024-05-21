<script lang="ts">
  import { TreeView, TreeViewItem } from '@skeletonlabs/skeleton';
  import variantData from '$lib/components/explorer/gemone-filter/variant-data.json';

  export let selectedConsequence: string[] = [];

  let severityChildren: TreeViewItem[][] = variantData.map(() => []);
</script>

<div class="overflow-auto h-60 max-h-60">
  <TreeView selection multiple open padding="py-0 px-0" spacing="space-y-0">
    {#each variantData as severity, sIndex}
      <TreeViewItem
        bind:group={selectedConsequence}
        name="severity"
        value={severity.key}
        children={severityChildren[sIndex]}
      >
        <p>{severity.key}</p>
        <svelte:fragment slot="children">
          {#each severity.children as child, cIndex}
            <TreeViewItem
              bind:this={severityChildren[sIndex][cIndex]}
              bind:group={selectedConsequence}
              name={severity.key}
              value={child}
            >
              <p>{child}</p>
            </TreeViewItem>
          {/each}
        </svelte:fragment>
      </TreeViewItem>
    {/each}
  </TreeView>
</div>

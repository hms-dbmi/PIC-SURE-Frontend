<script lang="ts">
  import { TreeView, TreeViewItem } from '@skeletonlabs/skeleton';

  import variantData from '$lib/components/explorer/genome-filter/variant-data.json';

  import { selectedConsequence } from '$lib/stores/GeneFilter';

  let severityChildren: TreeViewItem[][] = $state(variantData.map(() => []));

  const intersection = (A: string[], B: string[]) => A.some((a: string) => B.includes(a));
</script>

<div class="overflow-auto h-[350.75px]">
  <TreeView selection multiple open padding="py-0 px-0" spacing="space-y-0">
    {#each variantData as severity, sIndex}
      <TreeViewItem
        bind:group={$selectedConsequence}
        name="severity"
        value={severity.key}
        children={severityChildren[sIndex]}
        open={intersection($selectedConsequence, severity.children)}
      >
        <p>{severity.key}</p>
        <!-- @migration-task: migrate this slot by hand, `children` would shadow a prop on the parent component -->
  <svelte:fragment slot="children">
          {#each severity.children as child, cIndex}
            <TreeViewItem
              bind:this={severityChildren[sIndex][cIndex]}
              bind:group={$selectedConsequence}
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

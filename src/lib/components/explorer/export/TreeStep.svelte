<script lang="ts">
  import { getInitialTree, getConceptTree } from '$lib/stores/Dictionary';
  import { addConcept, removeConcept } from '$lib/stores/TreeStepConcepts';
  import Loading from '$lib/components/Loading.svelte';
  import RemoteTree from '$lib/components/tree/RemoteTree.svelte';
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import type { SearchResult } from '$lib/models/Search';
  import { selectedConcepts } from '$lib/stores/TreeStepConcepts';
  import { get } from 'svelte/store';
  // Calculate largestDepth synchronously before template renders
  let largestDepth: number =
    $selectedConcepts && $selectedConcepts.length > 0
      ? Math.max(
          ...$selectedConcepts.map((concept: string) => concept.split('\\').filter(Boolean).length),
        )
      : 1;

  async function fetchChildren(conceptPath: string): Promise<SearchResult[]> {
    const dataset = conceptPath.split('\\')[1];
    const depth = conceptPath.split('\\').filter(Boolean).length;
    const treeNodes = await getConceptTree(dataset, depth, conceptPath);

    function getAllLeaves(node: SearchResult): SearchResult[] {
      if (!node.children || node.children.length === 0) {
        return [node];
      }
      return node.children.flatMap(getAllLeaves);
    }

    const leaves = getAllLeaves(treeNodes);
    if (leaves.length === 1 && leaves[0].conceptPath === conceptPath) {
      return [];
    }

    return leaves;
  }

  const selectNode = (value: string) => {
    addConcept(value);
  };

  const unselectNode = (value: string) => {
    removeConcept(value);
  };
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  <div class="w-full h-full m-2 card p-4">
    <header class="card-header">
      Select <strong>additional variables</strong> you would like to be included in your final data export.
    </header>
    <hr />
    <div class="card-body p-4">
      {#await getInitialTree(largestDepth)}
        <Loading ring size="small" />
      {:then treeNodes}
        <RemoteTree
          initialNodes={treeNodes}
          {fetchChildren}
          fullWidth={true}
          onselect={selectNode}
          onunselect={unselectNode}
          previousSelectedConcepts={get(selectedConcepts)}
        />
      {/await}
    </div>
  </div>
</section>

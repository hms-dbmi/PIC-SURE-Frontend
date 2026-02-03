<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import type { ExportInterface } from '$lib/models/Export';
  import { getInitialTree, getConceptTree } from '$lib/stores/Dictionary';
  import { exports } from '$lib/stores/Export';
  import { addExport, removeExport, mapSearchResultAsExport } from '$lib/stores/Export';
  import Loading from '$lib/components/Loading.svelte';
  import RemoteTree from '$lib/components/tree/RemoteTree.svelte';
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import { getQueryRequest } from '$lib/ExportStepperManager.svelte';

  let currentExports: ExportInterface[] = $state($exports);
  exports.subscribe((newExports) => (currentExports = newExports));

  let disabledConcepts: string[] = $derived(getQueryRequest().query.select);
  let selectedConcepts: string[] = $derived([
    ...currentExports.map(({ conceptPath }) => conceptPath),
    ...disabledConcepts,
  ]);

  // Calculate largestDepth synchronously before template renders
  let largestDepth: number = $derived(
    selectedConcepts.length > 0
      ? Math.max(
          ...selectedConcepts.map((concept: string) => concept.split('\\').filter(Boolean).length),
        )
      : 1,
  );

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

  const onselect = (search?: SearchResult) => {
    if (!search) return;
    addExport(mapSearchResultAsExport(search));
  };

  const onunselect = (search?: SearchResult) => {
    if (!search) return;
    removeExport(mapSearchResultAsExport(search));
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
          {onselect}
          {onunselect}
          {selectedConcepts}
          {disabledConcepts}
        />
      {/await}
    </div>
  </div>
</section>

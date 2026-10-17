<script lang="ts">
  import type { SearchResult } from '#lib/explorer/types.ts';
  import { getInitialTree, getConceptTree } from '#lib/explorer/Dictionary.ts';
  import { exports } from '#lib/explorer/export/Export.ts';
  import { addExport, removeExport, mapSearchResultAsExport } from '#lib/explorer/export/Export.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import RemoteTree from '#lib/ui/tree/RemoteTree.svelte';
  import Summary from '#lib/explorer/export/Summary.svelte';
  import { getQueryRequest } from '#lib/explorer/export/ExportStepperManager.svelte.ts';

  let disabledConcepts: string[] = $derived(getQueryRequest().query.select);
  let selectedConcepts: string[] = $derived([
    ...$exports.map(({ conceptPath }) => conceptPath),
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

  async function fetchChildren(conceptPath: string): Promise<SearchResult[] | undefined | null> {
    const dataset = conceptPath.split('\\')[1];
    const depth = conceptPath.split('\\').filter(Boolean).length;
    const treeNodes = await getConceptTree(dataset, depth, conceptPath);

    // Search the tree for the matching concept path, which could be nested. Return it's children.
    function getParentNode(node: SearchResult): SearchResult | undefined {
      if (node.conceptPath === conceptPath) {
        return node || undefined;
      }

      // Search through children for matching concept path only if concept path starts with current
      if (conceptPath.startsWith(node.conceptPath + '/')) {
        for (const child of node.children || []) {
          const result = getParentNode(child);
          if (result) {
            return result;
          }
        }
      }

      return undefined;
    }

    const parent = getParentNode(treeNodes);
    return parent?.children;
  }

  const onselect = (searchResult?: SearchResult) => {
    if (!searchResult) return;
    addExport(mapSearchResultAsExport(searchResult));
  };

  const onunselect = (searchResult?: SearchResult) => {
    if (!searchResult) return;
    removeExport(mapSearchResultAsExport(searchResult));
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

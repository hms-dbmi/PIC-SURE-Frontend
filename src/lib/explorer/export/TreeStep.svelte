<script lang="ts">
  import type { SearchResult } from '#lib/explorer/types.ts';
  import { getInitialTree, getConceptTree } from '#lib/explorer/Dictionary.ts';
  import { exports } from '#lib/explorer/export/Export.ts';
  import { addExport, removeExport, mapSearchResultAsExport } from '#lib/explorer/export/Export.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import TreeView from '#lib/ui/tree/TreeView.svelte';
  import { toConceptNodes } from '#lib/explorer/export/conceptTree.ts';
  import Summary from '#lib/explorer/export/Summary.svelte';
  import { getQueryRequest } from '#lib/explorer/export/ExportStepperManager.svelte.ts';
  import { cardClass } from '#lib/ui/surface.ts';
  import { untrack } from 'svelte';

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

  async function loadChildren(concept: SearchResult) {
    const children = await fetchChildren(concept.conceptPath);
    return children && toConceptNodes(children);
  }

  // The tree takes over the selection once built; reading the selected concepts tracked would
  // rebuild it, and drop what's open, on every change.
  const initialNodes = (concepts: SearchResult[]) =>
    untrack(() => toConceptNodes(concepts, selectedConcepts, disabledConcepts));

  const onselect = (searchResult: SearchResult) => {
    addExport(mapSearchResultAsExport(searchResult));
  };

  const onunselect = (searchResult: SearchResult) => {
    removeExport(mapSearchResultAsExport(searchResult));
  };
</script>

<section class="flex flex-col w-full h-full items-center">
  <Summary />
  <div class="w-full h-full m-2 {cardClass} p-4">
    <header class="card-header">
      Select <strong>additional variables</strong> you would like to be included in your final data export.
    </header>
    <hr />
    <div class="card-body p-4">
      {#await getInitialTree(largestDepth)}
        <Loading ring size="small" />
      {:then treeNodes}
        <TreeView
          nodes={initialNodes(treeNodes)}
          label="Variables"
          class="overflow-auto w-full"
          {loadChildren}
          {onselect}
          {onunselect}
        />
      {/await}
    </div>
  </div>
</section>

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
  import { settings } from '$lib/configuration';

  // An additional depth to get children - loads more up front if concept path is short,
  // but reduces api calls when there are hundereds of children.
  const API_BUFFER: number = settings.export.apiBuffer || 15;

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
          API_BUFFER, // initial tree load depth to reduce overall api calls
          ...selectedConcepts.map((concept: string) => concept.split('\\').filter(Boolean).length),
        )
      : 1,
  );

  async function fetchChildren(conceptPath: string): Promise<SearchResult[] | undefined | null> {
    const dataset = conceptPath.split('\\')[1];
    const depth = conceptPath.split('\\').filter(Boolean).length + API_BUFFER;
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

<script lang="ts">
  import type { SearchResult } from '$lib/models/Search';
  import type { NodeInterface } from '$lib/components/tree/types';
  import { type Filter, createAnyRecordOfFilter } from '$lib/models/Filter';
  import { activeRow } from '$lib/stores/ExpandableRow';
  import { addFilter } from '$lib/stores/Filter';
  import RadioTree from '$lib/components/tree/RadioTree.svelte';
  import { getConceptTree } from '$lib/stores/Dictionary';
  import { panelOpen } from '$lib/stores/SidePanel';
  import Loading from '$lib/components/Loading.svelte';

  interface Props {
    data?: SearchResult;
    onclose?: () => void;
  }

  const ENSURE_MAX_DEPTH = 100;
  let { data = {} as SearchResult, onclose = () => {} }: Props = $props();
  let conceptNodes = $state(
    data.conceptPath.split('\\').reduce((acc, node, index, array) => {
      if (index === 0 && node === '') return acc;
      if (index === array.length - 1 && node === '') return acc;
      return [...acc, node];
    }, [] as string[]),
  );
  let treeNode: NodeInterface | null = $state(createHierarchy());

  function createHierarchy(): NodeInterface | null {
    if (!conceptNodes.length) return null;

    let currentNode: NodeInterface | null = null;
    let currentPath = '';

    for (let i = conceptNodes.length - 1; i >= 0; i--) {
      const nodeName = conceptNodes[i];
      currentPath =
        i === 0 ? `\\${nodeName}` : `${currentPath ? nodeName + '\\' + currentPath : nodeName}`;

      currentNode = {
        name: nodeName,
        value: `\\${conceptNodes.slice(0, i + 1).join('\\')}\\`,
        children: currentNode ? [currentNode] : [],
        open: true,
        selected: false,
      };
    }

    return currentNode;
  }

  let selectedNode = $state(data.conceptPath);
  let isLoading = $state(false);

  async function addSelection() {
    if (isLoading) return;

    isLoading = true;
    try {
    const treeResult: SearchResult = await getConceptTree(
      data.dataset,
      ENSURE_MAX_DEPTH,
      selectedNode,
    );
    let filter: Filter;
    const searchResult: SearchResult = {
      conceptPath: selectedNode,
      display: selectedNode.split('\\').filter(Boolean).pop() || selectedNode,
      name: selectedNode,
      allowFiltering: true,
      dataset: data.dataset,
      studyAcronym: data.studyAcronym,
      description: `Any Record of ${selectedNode}`,
      meta: data.meta,
      study: data.study,
      table: data.table,
      type: 'AnyRecordOf',
    };
      filter = createAnyRecordOfFilter(searchResult, treeResult);
      addFilter(filter);
      finish();
    } catch (error) {
      console.error('Error adding selection:', error);
    } finally {
      isLoading = false;
    }
  }

  function finish() {
    $activeRow = '';
    $panelOpen = true;
    onclose();
  }
</script>

<div data-testid="hierarchy-component" class="flex flex-row bg-surface-100 p-4 rounded-container">
  {#if treeNode}
    <RadioTree fullWidth={true} nodes={[treeNode]} onselect={(value) => (selectedNode = value)} />
  {/if}
  <button
    class="btn btn-icon preset-filled-primary-500 m-1"
    data-testid="add-filter"
    aria-label={isLoading ? "Adding Filter..." : "Add Filter"}
    onclick={addSelection}
    disabled={isLoading}
  >
    {#if isLoading}
      <Loading size="micro" color="surface" />
    {:else}
      <i class="fas fa-plus"></i>
    {/if}
  </button>
</div>

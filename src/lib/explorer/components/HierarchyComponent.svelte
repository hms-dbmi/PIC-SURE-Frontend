<script lang="ts">
  import type { SearchResult } from '#lib/explorer/types.ts';
  import type { TreeNodeInit } from '#lib/ui/tree/treeModel.svelte.ts';
  import {
    type Filter,
    AnyRecordOfFilterError,
    createAnyRecordOfFilter,
  } from '#lib/query/filter.svelte.ts';
  import { activeRow } from '#lib/explorer/ExpandableRow.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import TreeView from '#lib/ui/tree/TreeView.svelte';
  import {
    getConceptTree,
    getHierarchyConcepts,
    ENSURE_MAX_DEPTH,
  } from '#lib/explorer/Dictionary.ts';
  import { panelOpen } from '#lib/explorer/panel.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import { toaster } from '#lib/ui/toaster.ts';
  import AlertDialog from '#lib/ui/dialog/AlertDialog.svelte';
  import { exploreMode } from '#lib/explorer/mode.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import { sortHierarchyDeepestFirst } from '#lib/utils/hierarchy.ts';
  import { log, createLog, getPageContext } from '#lib/telemetry/logger.ts';
  import Button from '#lib/ui/Button.svelte';
  interface Props {
    data?: SearchResult;
    onclose?: () => void;
  }
  let { data = {} as SearchResult, onclose = () => {} }: Props = $props();

  let modalOpen: boolean = $state(false);
  let selectedNode: string | undefined = $state(undefined);
  let isLoading = $state(false);
  let disableAddFilter: boolean = $derived(!data?.allowFiltering && exploreMode() === 'discover');

  async function getHierarchy(): Promise<TreeNodeInit<string>[]> {
    if (!data?.dataset || !data?.conceptPath) {
      throw new Error('Dataset and concept path are required');
    }

    try {
      const hierarchyConcepts = await getHierarchyConcepts(data.dataset, data.conceptPath);

      if (!hierarchyConcepts?.length) {
        throw new Error('No hierarchy concepts found');
      }

      const sorted = sortHierarchyDeepestFirst(hierarchyConcepts);

      // Built deepest first, so the leaf (this variable) starts selected.
      const rootNode = sorted.reduce<TreeNodeInit<string> | null>(
        (child, concept) => createNode(concept, child),
        null,
      );

      selectedNode = sorted[0].conceptPath;

      return rootNode ? [rootNode] : [];
    } catch (error) {
      console.error(
        'Error getting hierarchy concepts: ',
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  function createNode(
    concept: SearchResult,
    child: TreeNodeInit<string> | null,
  ): TreeNodeInit<string> {
    const name = `${concept.display} (${concept.name})`;
    return {
      name,
      value: concept.conceptPath,
      label: name,
      payload: concept.conceptPath,
      children: child ? [child] : undefined,
      open: true,
      selected: !child,
      disabled: disableAddFilter,
    };
  }

  async function addSelection() {
    if (isLoading) return;
    if (!selectedNode) {
      toaster.error({
        description: 'No selection made',
      });
      return;
    }

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
      filterState.add(filter);
      finish();
    } catch (error: unknown) {
      if (error instanceof AnyRecordOfFilterError) {
        modalOpen = true;
      } else {
        console.error('Error adding selection: ', error instanceof Error ? error.message : error);
        toaster.error({
          description:
            'Something went wrong when adding the filter. If the problem persists, please contact your administrator.',
        });
      }
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

<AlertDialog
  bind:open={modalOpen}
  data-testid="explorer-hierarchy-error-modal"
  title="Data tree selection too large"
  acknowledgeLabel="Okay"
  size="half"
>
  <div data-testid="explorer-hierarchy-error-content">
    <p class="m-0">
      The level of the data tree you selected exceeds 9,500 variables. This was not added as a
      filter to your query. Please make a selection lower in the data tree and try again.
    </p>
  </div>
</AlertDialog>
<div
  data-testid="explorer-hierarchy"
  class="flex flex-row justify-between bg-surface-100 p-4 rounded-container"
>
  <div class="flex flex-col gap-2">
    {#if disableAddFilter}
      <ErrorAlert color="warning">
        <p class="m-0">Filtering is not available for this variable</p>
      </ErrorAlert>
    {/if}
    {#await getHierarchy()}
      <Loading ring size="small" />
    {:then treeNodes}
      <TreeView
        nodes={treeNodes}
        label="Data tree"
        selection="single"
        class="w-full"
        onselect={(value) => {
          selectedNode = value;
          log(
            createLog('ACTION', 'hierarchy.node_select', {
              node: value,
              pageContext: getPageContext(),
            }),
          );
        }}
      />
    {:catch error}
      <ErrorAlert color="error">
        <p class="m-0">Error loading hierarchy</p>
        <span class="text-sm text-gray-500 hidden"
          >{error instanceof Error ? error.message : String(error)}</span
        >
      </ErrorAlert>
    {/await}
  </div>
  <Button
    size="icon"
    class="m-1"
    data-testid="filter-add"
    aria-label={isLoading ? 'Adding Filter...' : 'Add Filter'}
    onclick={addSelection}
    disabled={isLoading || disableAddFilter}
  >
    {#if isLoading}
      <Loading size="micro" color="white" />
    {:else if disableAddFilter}
      <i class="fas fa-warning"></i>
      <span class="sr-only">Filtering is not available for this variable</span>
    {:else}
      <i class="fas fa-plus"></i>
    {/if}
  </Button>
</div>

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
  import { toaster } from '$lib/toaster';
  import { AnyRecordOfFilterError } from '$lib/types';
  import Modal from '$lib/components/Modal.svelte';
  import { page } from '$app/state';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { getHierarchyConcepts } from '$lib/stores/Dictionary';

  const ENSURE_MAX_DEPTH = 100;

  interface Props {
    data?: SearchResult;
    onclose?: () => void;
  }
  let { data = {} as SearchResult, onclose = () => {} }: Props = $props();

  let modalOpen: boolean = $state(false);
  let selectedNode: string | undefined = $state(undefined);
  let isLoading = $state(false);
  let disableAddFilter: boolean = $derived(
    !data?.allowFiltering && page.url.pathname.includes('/discover'),
  );

  async function getHierarchy(): Promise<NodeInterface[]> {
    if (!data?.dataset || !data?.conceptPath) {
      throw new Error('Dataset and concept path are required');
    }

    try {
      const hierarchyConcepts = await getHierarchyConcepts(data.dataset, data.conceptPath);

      if (!hierarchyConcepts?.length) {
        throw new Error('No hierarchy concepts found');
      }

      const rootNode = hierarchyConcepts.reduce<NodeInterface | null>((parent, concept) => {
        const node = createNode(concept);
        if (parent) {
          node.children = [parent];
        }
        return node;
      }, null);

      return rootNode ? [rootNode] : [];
    } catch (error) {
      console.error(
        'Error getting hierarchy concepts: ',
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  function createNode(concept: SearchResult): NodeInterface {
    return {
      name: `${concept.display} (${concept.name})`,
      value: concept.conceptPath,
      children: [],
      open: true,
      selected: false,
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
      addFilter(filter);
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

<Modal
  bind:open={modalOpen}
  data-testid="hierarchy-component-error-modal"
  title="Data tree selection too large"
  closeable={true}
  width="w-1/2"
>
  <div data-testid="hierarchy-component-error-modal-content">
    <p class="m-0">
      The level of the data tree you selected exceeds 9,500 variables. This was not added as a
      filter to your query. Please make a selection lower in the data tree and try again.
    </p>
    <div class="flex justify-center mt-4">
      <button class="btn preset-filled-primary-500" onclick={() => (modalOpen = false)}>Okay</button
      >
    </div>
  </div>
</Modal>
<div
  data-testid="hierarchy-component"
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
      <RadioTree
        fullWidth={true}
        nodes={treeNodes}
        disableTree={disableAddFilter}
        onselect={(value) => (selectedNode = value)}
      />
    {:catch error}
      <ErrorAlert color="error">
        <p class="m-0">Error loading hierarchy: {error instanceof Error ? error.message : error}</p>
      </ErrorAlert>
    {/await}
  </div>
  <button
    class="btn btn-icon preset-filled-primary-500 m-1"
    data-testid="add-filter"
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
  </button>
</div>

<script lang="ts">
  import { writable } from 'svelte/store';
  import { getInitialTree, getConceptTree } from '$lib/stores/Dictionary';
  import Loading from '$lib/components/Loading.svelte';
  import RemoteTree from '$lib/components/tree/RemoteTree.svelte';
  import Summary from '$lib/components/explorer/export/Summary.svelte';
  import type { QueryRequestInterface } from '$lib/models/api/Request';

  interface Props {
    query: QueryRequestInterface;
  }

  export const selectedConcepts = writable<string[]>([]);

  let { query }: Props = $props();

  async function fetchChildren(conceptPath: string) {
    const dataset = conceptPath.split('\\')[1];
    const treeNodes = await getConceptTree(dataset, 1, conceptPath);
    return treeNodes.children || [];
  }

  const selectNode = (value: string) => {
    selectedConcepts.update((prev) => [...prev, value]);
  };

  const unselectNode = (value: string) => {
    selectedConcepts.update((prev) => prev.filter((concept) => concept !== value));
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
      {#await getInitialTree()}
        <Loading ring size="small" />
      {:then treeNodes}
        <RemoteTree
          initialNodes={treeNodes}
          {fetchChildren}
          fullWidth={true}
          onselect={selectNode}
          onunselect={unselectNode}
        />
      {/await}
    </div>
  </div>
</section>

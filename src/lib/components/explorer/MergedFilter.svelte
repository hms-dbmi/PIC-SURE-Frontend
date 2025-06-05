<script lang="ts">
  import { JoinTypes, type MergableFilterInterface } from '$lib/models/Filter';
  import { addFilter, removeFilter } from '$lib/stores/Filter';
  import BooleanSelect from '$lib/components/explorer/BooleanSelect.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import ViewAnyRecordOfFilter from '$lib/components/explorer/ViewAnyRecordOfFilter.svelte';

  let { filter }: { filter: MergableFilterInterface } = $props();
  let joinType = $state(filter.joinType || JoinTypes.AND);
  let open = $state(false);

  function onChange(value: JoinTypes) {
    filter.joinType = value;
    if (value === JoinTypes.AND) {
      unmergeFilters(filter);
    }
  }

  // function mergeFilters(filter: MergableFilterInterface) {
  //   filter.concepts = [...(filter.mergedFilter1?.concepts || []), ...(filter.mergedFilter2?.concepts || [])];
  //   filter.description = `Variables in ${filter.mergedFilter1?.searchResult?.display || filter.mergedFilter1?.searchResult?.name || filter.mergedFilter1?.variableName} ${filter.joinType === JoinTypes.AND ? 'and' : 'or'} ${filter.mergedFilter2?.searchResult?.display || filter.mergedFilter2?.searchResult?.name || filter.mergedFilter2?.variableName}`;
  //   filter.displayType = 'merged';
  //   removeFilter(filter.mergedFilter1?.id || '');
  //   removeFilter(filter.mergedFilter2?.id || '');
  //   addFilter(filter);
  // }

  function unmergeFilters(filter: MergableFilterInterface) {
    filter.description = `Variables in ${filter.mergedFilter1?.searchResult?.display || filter.mergedFilter1?.searchResult?.name || filter.mergedFilter1?.variableName} ${filter.joinType === JoinTypes.AND ? 'and' : 'or'} ${filter.mergedFilter2?.searchResult?.display || filter.mergedFilter2?.searchResult?.name || filter.mergedFilter2?.variableName}`;
    filter.concepts = [];
    filter.displayType = 'unmerged';
    removeFilter(filter.id);
    addFilter(filter.mergedFilter1 as MergableFilterInterface);
    addFilter(filter.mergedFilter2 as MergableFilterInterface);
  }
</script>

<Modal class="flex flex-col card bg-surface-100 p-1 m-1" bind:open>
  {#snippet trigger()}
    <div class="flex flex-col card bg-surface-100 p-1 m-1">
      {`${(filter.mergedFilter1 as MergableFilterInterface)?.concepts?.length} variable(s) in ${filter.mergedFilter1?.searchResult?.display || filter.mergedFilter1?.searchResult?.name || filter.mergedFilter1?.variableName} category`}
      <BooleanSelect value={joinType} onChange={(value) => onChange(value)} />
      {`${(filter.mergedFilter2 as MergableFilterInterface)?.concepts?.length} variable(s) in ${filter.mergedFilter2?.searchResult?.display || filter.mergedFilter2?.searchResult?.name || filter.mergedFilter2?.variableName} category`}
    </div>
  {/snippet}  
  <ViewAnyRecordOfFilter {filter} />
</Modal>
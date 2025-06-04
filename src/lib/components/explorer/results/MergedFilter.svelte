<script lang="ts">
  import type { AnyRecordOfFilterInterface, Filter } from '$lib/models/Filter';
  import BooleanSelect from '$lib/components/explorer/results/BooleanSelect.svelte';
  import { filters } from '$lib/stores/Filter';

  let { filters: initialFilters }: { filters: AnyRecordOfFilterInterface[] } = $props();
  let isMerged = $state(false);
  let mergedFilter = $state<AnyRecordOfFilterInterface | null>(null);
  let unmergedFilters = $state<AnyRecordOfFilterInterface[]>(initialFilters);

  const mergeFilters = (filters: AnyRecordOfFilterInterface[]): AnyRecordOfFilterInterface | null => {
    if (filters.length < 2) return null;
    
    const firstFilter = filters[0];
    const secondFilter = filters[1];
    
    return {
      ...firstFilter,
      concepts: [
        ...firstFilter.concepts,
        ...secondFilter.concepts
      ],
      joinType: firstFilter.joinType
    };
  };

  const unmergeFilter = (filter: AnyRecordOfFilterInterface): AnyRecordOfFilterInterface[] => {
    const midPoint = Math.floor(filter.concepts.length / 2);
    const firstFilter: AnyRecordOfFilterInterface = {
      ...filter,
      concepts: filter.concepts.slice(0, midPoint),
      joinType: 'and' as const
    };
    const secondFilter: AnyRecordOfFilterInterface = {
      ...filter,
      concepts: filter.concepts.slice(midPoint),
      joinType: 'and' as const
    };
    return [firstFilter, secondFilter];
  };

  const handleJoinTypeChange = (filter: Filter, value: 'and' | 'or') => {
    if (value === 'or' && !isMerged) {
      mergedFilter = mergeFilters(unmergedFilters);
      if (mergedFilter) {
        isMerged = true;
        // Update the global filters store
        const otherFilters = $filters.filter(f => f.filterType !== 'AnyRecordOf');
        filters.set([...otherFilters, mergedFilter]);
      }
    } else if (value === 'and' && isMerged && mergedFilter) {
      const unmerged = unmergeFilter(mergedFilter);
      unmergedFilters = unmerged;
      isMerged = false;
      // Update the global filters store
      const otherFilters = $filters.filter(f => f.filterType !== 'AnyRecordOf');
      filters.set([...otherFilters, ...unmerged]);
    }
  };
</script>

<div>
  {#if isMerged && mergedFilter}
    <div>
      <div>
        {`${mergedFilter.concepts.length} variable(s) in ${mergedFilter.searchResult?.display || mergedFilter.searchResult?.name || mergedFilter.variableName} category`}
      </div>
      <BooleanSelect 
        value={mergedFilter.joinType} 
        onChange={(value) => handleJoinTypeChange(mergedFilter as Filter, value)} 
      />
    </div>
  {:else}
    {#each unmergedFilters as filter, index}
      <div>
        <div>
          {`${filter.concepts.length} variable(s) in ${filter.searchResult?.display || filter.searchResult?.name || filter.variableName} category`}
        </div>
        {#if index % 2 === 1}
          <BooleanSelect 
            value={filter.joinType} 
            onChange={(value) => handleJoinTypeChange(filter, value)} 
          />
        {/if}
      </div>
    {/each}
  {/if}
</div> 
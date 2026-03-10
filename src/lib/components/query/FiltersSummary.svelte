<script lang="ts">
  import type {
    Filter,
    FilterInterface,
    FilterGroupInterface,
    AnyRecordOfFilterInterface,
  } from '$lib/models/Filter';
  import { LogicTree } from '$lib/models/LogicTree.svelte';

  let {
    filterTree,
    genomicFilters,
  }: {
    filterTree: LogicTree<FilterInterface>;
    genomicFilters: Filter[];
  } = $props();

  let length = $derived(filterTree.length + genomicFilters.length);

  function filterDescription(filter: Filter): string {
    if (filter.filterType === 'Categorical') {
      if (filter.displayType === 'restrict') {
        const n = filter.categoryValues.length;
        return `${n > 1 ? n + ' ' : ''}value${n !== 1 ? 's' : ''}: ${filter.categoryValues.join(', ')}`;
      }
      return 'Any value';
    }
    if (filter.filterType === 'AnyRecordOf') {
      return `${(filter as AnyRecordOfFilterInterface).concepts.length} variable(s)`;
    }
    if (filter.filterType === 'numeric') {
      switch (filter.displayType) {
        case 'between':
          return `Between ${filter.min} and ${filter.max}`;
        case 'greaterThan':
          return `> ${filter.min}`;
        case 'lessThan':
          return `< ${filter.max}`;
        default:
          return 'Any value';
      }
    }
    return filter.description || '';
  }

  function studyLabel(filter: Filter): string {
    const sr = filter.searchResult;
    if (!sr) return filter.dataset || '';
    if (sr.studyAcronym && sr.dataset) return `${sr.studyAcronym} · ${sr.dataset}`;
    return sr.studyAcronym || sr.dataset || filter.dataset || '';
  }
</script>

{#snippet filterCard(filter: Filter)}
  <div class="card bg-surface-100 flex flex-col gap-0.5 text-sm">
    <p class="font-semibold leading-snug mb-0" title={filter.variableName}>
      {filter.variableName || filter.id}
    </p>
    {#if studyLabel(filter)}
      <p class="text-xs text-surface-700 mt-0.5">From {studyLabel(filter)}</p>
    {/if}
    {#if filterDescription(filter)}
      <p class="text-surface-700 mt-0.5">{filterDescription(filter)}</p>
    {/if}
  </div>
{/snippet}

{#snippet operatorDivider(operator: string)}
  <div class="flex items-center gap-2 px-1 my-0.5">
    <div class="h-px flex-1 {operator === 'OR' ? 'bg-tertiary-300' : 'bg-surface-300'}"></div>
    <span
      class="text-xs font-bold px-2 py-0.5 rounded-full {operator === 'OR'
        ? 'bg-tertiary-100 text-tertiary-700'
        : 'bg-surface-200 text-surface-500'}"
    >
      {operator}
    </span>
    <div class="h-px flex-1 {operator === 'OR' ? 'bg-tertiary-300' : 'bg-surface-300'}"></div>
  </div>
{/snippet}

{#snippet filterNode(node: FilterInterface)}
  {#if node.filterType === 'FilterGroup'}
    {@const group = node as FilterGroupInterface}
    <div
      class="border-l-2 pl-3 flex flex-col gap-1 {group.operator === 'OR'
        ? 'border-tertiary-400'
        : 'border-surface-300'}"
    >
      {#each group.children as child, i}
        {#if i > 0}
          {@render operatorDivider(group.operator)}
        {/if}
        {@render filterNode(child as FilterInterface)}
      {/each}
    </div>
  {:else}
    {@render filterCard(node as Filter)}
  {/if}
{/snippet}

{#if length === 0}
  <p class="text-sm text-surface-400 text-center py-2">No filters applied</p>
{:else}
  <div class="flex flex-col gap-1">
    {#each filterTree.root.children as child, i}
      {#if i > 0}
        {@render operatorDivider('AND')}
      {/if}
      {@render filterNode(child as FilterInterface)}
    {/each}
    {#if genomicFilters.length > 0}
      {#if filterTree.length > 0}
        {@render operatorDivider('AND')}
      {/if}
      {#each genomicFilters as filter, i}
        {#if i > 0}
          {@render operatorDivider('AND')}
        {/if}
        {@render filterCard(filter)}
      {/each}
    {/if}
  </div>
{/if}

<script lang="ts">
  import OperatorBadge from '#lib/ui/OperatorBadge.svelte';
  import {
    studyLabel,
    summarizeFilter,
    type Filter,
    type FilterInterface,
    type FilterGroupInterface,
  } from '#lib/query/filter.svelte.ts';
  import { LogicTree } from '#lib/query/logicTree.svelte.ts';
  import { cardClass } from '#lib/ui/surface.ts';

  let {
    filterTree,
    genomicFilters,
  }: {
    filterTree: LogicTree<FilterInterface>;
    genomicFilters: Filter[];
  } = $props();

  let length = $derived(filterTree.length + genomicFilters.length);
</script>

{#snippet filterCard(filter: Filter)}
  {@const study = studyLabel(filter.searchResult, { compact: true }) || filter.dataset || ''}
  {@const description = summarizeFilter(filter)}
  <div
    class="{cardClass} bg-surface-100 flex flex-col ml-2 p-3 gap-0.5 text-sm"
    data-testid="dataset-filter-card"
  >
    <p class="font-semibold leading-snug m-0" title={filter.variableName}>
      {filter.variableName || filter.id}
    </p>
    {#if study}
      <p class="text-xs text-surface-700 m-0 mb-1">From {study}</p>
    {/if}
    {#if description}
      <p class="text-surface-700 m-0 mt-1">{description}</p>
    {/if}
  </div>
{/snippet}

{#snippet operatorDivider(operator: string)}
  <div class="flex items-center gap-2 px-0 my-0.5" data-testid="dataset-operator-divider">
    <div class="h-px flex-1 {operator === 'OR' ? 'bg-secondary-300' : 'bg-primary-300'}"></div>
    <OperatorBadge {operator} />
    <div class="h-px flex-1 {operator === 'OR' ? 'bg-secondary-300' : 'bg-primary-300'}"></div>
  </div>
{/snippet}

{#snippet filterNode(node: FilterInterface)}
  {#if node.filterType === 'FilterGroup'}
    {@const group = node as FilterGroupInterface}
    <div
      data-testid="dataset-filter-node"
      class="border-l-2 px-0 ml-2 flex flex-col gap-1 {group.operator === 'OR'
        ? 'border-secondary-400'
        : 'border-primary-300'}"
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
        {@render operatorDivider((filterTree.root as FilterGroupInterface).operator)}
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

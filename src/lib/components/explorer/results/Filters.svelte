<script lang="ts">
  import type { FilterGroupInterface } from '$lib/models/Filter.svelte';
  import { filterTree, filters, genomicFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import ResultsFilterGroup from '$lib/components/explorer/results/ResultsFilterGroup.svelte';
</script>

{#if $filters.length + $genomicFilters.length + $exports.length === 0}
  <p class="text-center">No filters added</p>
{:else}
  <div class="px-4 mb-1 w-80">
    {#if $filters.length + $genomicFilters.length > 0}
      <header class="text-left ml-1">Filters</header>
    {/if}
    <section class="py-1">
      <ResultsFilterGroup group={$filterTree.root as FilterGroupInterface} />
      {#if $genomicFilters.length > 0 && $filters.length > 0}
        <span class="font-semibold text-xs py-0.5">AND</span>
      {/if}
      {#each $genomicFilters as filter}
        <FilterComponent {filter} />
      {/each}
    </section>
  </div>
{/if}

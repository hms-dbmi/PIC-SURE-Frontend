<script lang="ts">
  import { page } from '$app/state';
  import { features } from '$lib/configuration';

  import type { FilterGroupInterface } from '$lib/models/Filter';
  import { filterTree, filters, genomicFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';

  let isOpenAccess = $derived(page.url.pathname.includes('/discover'));
</script>

{#if $filters.length + $genomicFilters.length + $exports.length === 0}
  <p class="text-center">No filters added</p>
{:else}
  <div class="px-4 mb-1 w-80">
    {#if $filters.length + $genomicFilters.length > 0}
      <header class="text-left ml-1">Filters</header>
    {/if}
    <section class="py-1">
      {#if features.explorer.enableOrQueries && isOpenAccess}
        <FilterGroup group={$filterTree.root as FilterGroupInterface} />
      {:else}
        {#each $filters as filter}
          <FilterComponent {filter} />
        {/each}
      {/if}
      {#each $genomicFilters as filter}
        <FilterComponent {filter} />
      {/each}
    </section>
  </div>
{/if}

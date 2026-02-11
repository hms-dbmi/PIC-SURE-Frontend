<script lang="ts">
  import { page } from '$app/state';
  import { features } from '$lib/configuration';

  import type { FilterGroupInterface } from '$lib/models/Filter.svelte';
  import { filterTree, filters, genomicFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import AdvancedFiltering from '$lib/components/explorer/advanced/AdvancedFiltering.svelte';

  let advancedModalOpen: boolean = $state(false);
  let advancedFilteringRef: ReturnType<typeof AdvancedFiltering>;
  let isOpenAccess = $derived(page.url.pathname.includes('/discover'));
</script>

<Modal
  bind:open={advancedModalOpen}
  title="Advanced Filters"
  withDefault
  width="w-full"
  height="h-full"
  confirmText="Apply Changes"
  onconfirm={() => {
    advancedFilteringRef?.applyChanges();
  }}
>
  <AdvancedFiltering bind:this={advancedFilteringRef} />
</Modal>
{#if $filters.length + $genomicFilters.length + $exports.length === 0}
  <p class="text-center">No filters added</p>
{:else}
  <div class="px-4 mb-1 w-80">
    {#if $filters.length + $genomicFilters.length > 0}
      <div>
        <header class="text-left ml-1">Filters</header>
        <button class="btn preset-filled-primary-500" onclick={() => (advancedModalOpen = true)}
          >Advanced Filters</button
        >
      </div>
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

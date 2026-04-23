<script lang="ts">
  import type { FilterGroupInterface } from '$lib/models/Filter.svelte';
  import { filterTree, filters, genomicFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import ResultsFilterGroup from '$lib/components/explorer/results/ResultsFilterGroup.svelte';
  import Popover from '$lib/components/Popover.svelte';

  interface Props {
    isDiscoverPage?: boolean;
  }

  let { isDiscoverPage = false }: Props = $props();

  let advancedFilteringDisabled = $derived($filters.length <= 1);

  const aqbBtnClass = 'btn btn-sm ml-auto preset-tonal-primary border border-primary-500';
</script>

{#if $filters.length + $genomicFilters.length + $exports.length === 0}
  <p class="text-center">No filters added</p>
{:else}
  <div class="px-4 mb-1 w-80">
    {#if $filters.length + $genomicFilters.length > 0}
      <div class="flex items-center m-1">
        <header class="text-left">Filters</header>
        {#if advancedFilteringDisabled}
          <Popover
            triggerTypes={['hover', 'focus']}
            triggerStyle="ml-auto"
            placement="left"
            message="Advanced Query Builder is not available with only one non-genomic filter."
          >
            {#snippet trigger()}
              <button data-testid="advanced-filtering-btn" class={aqbBtnClass} disabled>
                Build Advanced Query
              </button>
            {/snippet}
          </Popover>
        {:else}
          <a
            href={`${isDiscoverPage ? '/discover' : '/explorer'}/advanced-filtering`}
            data-testid="advanced-filtering-btn"
            class="{aqbBtnClass} !mr-0 hover:preset-filled-primary-500"
          >
            Build Advanced Query
          </a>
        {/if}
      </div>
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

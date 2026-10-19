<script lang="ts">
  import { resolve } from '$app/paths';
  import type { FilterGroupInterface } from '#lib/query/filter.svelte.ts';
  import { page } from '$app/state';
  import { filterTree, filters, genomicFilters } from '#lib/query/filters.ts';
  import { exports } from '#lib/explorer/export/Export.ts';

  import FilterComponent from '#lib/explorer/components/results/AddedFilter.svelte';
  import ResultsFilterGroup from '#lib/explorer/components/results/ResultsFilterGroup.svelte';
  import Popover from '#lib/ui/popover/Popover.svelte';
  import Button from '#lib/ui/Button.svelte';

  interface Props {
    isDiscoverPage?: boolean;
  }

  let { isDiscoverPage = false }: Props = $props();

  let isAdvancedFilteringPage = $derived(page.url.pathname.includes('/advanced-filtering'));
  let advancedFilteringDisabled = $derived($filters.length <= 1);
</script>

{#if $filters.length + $genomicFilters.length + $exports.length === 0}
  <p class="text-center">No filters added</p>
{:else}
  <div class="px-4 mb-1 w-80">
    {#if $filters.length + $genomicFilters.length > 0}
      <div class="flex items-center m-1">
        <header class="text-left">Filters</header>
        {#if isAdvancedFilteringPage}
          <!-- Hide the AQB affordance when we're already on the AF page -->
        {:else if advancedFilteringDisabled}
          <Popover
            triggerTypes={['hover', 'focus']}
            triggerStyle="ml-auto"
            placement="left"
            message="Advanced Query Builder is not available with only one non-genomic filter."
          >
            {#snippet trigger()}
              <Button
                id="results-advanced-filtering-open"
                data-testid="results-advanced-filtering-open"
                variant="tonal-static"
                size="sm"
                class="ml-auto"
                disabled
              >
                Build Advanced Query
              </Button>
            {/snippet}
          </Popover>
        {:else}
          <Button
            id="results-advanced-filtering-open"
            href={resolve(`${isDiscoverPage ? 'discover' : 'explorer'}/advanced-filtering`)}
            data-testid="results-advanced-filtering-open"
            variant="tonal"
            size="sm"
            class="ml-auto mr-0"
          >
            Build Advanced Query
          </Button>
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

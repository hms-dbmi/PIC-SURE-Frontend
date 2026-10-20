<script lang="ts">
  import { resolve } from '$app/paths';
  import type { FilterGroupInterface } from '#lib/query/filter.svelte.ts';
  import { page } from '$app/state';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { exports } from '#lib/explorer/export/Export.ts';

  import FilterComponent from '#lib/explorer/components/results/AddedFilter.svelte';
  import FilterTreeView from '#lib/query/components/FilterTreeView.svelte';
  import Popover from '#lib/ui/popover/Popover.svelte';
  import Button from '#lib/ui/Button.svelte';

  interface Props {
    isDiscoverPage?: boolean;
  }

  let { isDiscoverPage = false }: Props = $props();

  let isAdvancedFilteringPage = $derived(page.url.pathname.includes('/advanced-filtering'));
  let advancedFilteringDisabled = $derived(filterState.phenotypic.length <= 1);
</script>

{#if filterState.phenotypic.length + filterState.genomic.length + $exports.length === 0}
  <p class="text-center">No filters added</p>
{:else}
  <div class="px-4 mb-1 w-80">
    {#if filterState.phenotypic.length + filterState.genomic.length > 0}
      <div class="flex items-center m-1">
        <header class="text-left">Filters</header>
        {#if isAdvancedFilteringPage}
          <!-- Hide the AQB affordance when we're already on the AF page -->
        {:else if advancedFilteringDisabled}
          <Popover triggerTypes={['hover', 'focus']} placement="left">
            {#snippet trigger(props)}
              <Button
                {...props}
                id="results-advanced-filtering-open"
                data-testid="results-advanced-filtering-open"
                variant="tonal-static"
                size="sm"
                class="mr-0 ml-auto"
                aria-disabled="true"
              >
                Build Advanced Query
              </Button>
            {/snippet}
            Advanced Query Builder is not available with only one non-genomic filter.
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
      <div class="flex flex-col">
        <FilterTreeView group={filterState.tree.root as FilterGroupInterface}>
          {#snippet filter(node)}
            <FilterComponent filter={node} />
          {/snippet}
          {#snippet separator(operator)}
            <span class="font-semibold text-xs py-0.5" data-testid="results-filter-operator"
              >{operator}</span
            >
          {/snippet}
          {#snippet subgroup({ children })}
            <div class="flex flex-col border-l-3 border-gray-400 pl-2 ml-1">
              {@render children()}
            </div>
          {/snippet}
        </FilterTreeView>
      </div>
      {#if filterState.genomic.length > 0 && filterState.phenotypic.length > 0}
        <span class="font-semibold text-xs py-0.5">AND</span>
      {/if}
      {#each filterState.genomic as filter (filter.id)}
        <FilterComponent {filter} />
      {/each}
    </section>
  </div>
{/if}

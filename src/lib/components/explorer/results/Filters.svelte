<script lang="ts">
  import { page } from '$app/state';
  import { features } from '$lib/configuration';

  import type { FilterGroupInterface, FilterInterface } from '$lib/models/Filter';
  import { filterTree, filters, genomicFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import { DndContext, DragOverlay, useSensors, useSensor, TouchSensor, KeyboardSensor, MouseSensor } from '@dnd-kit-svelte/core';
  import { SortableContext } from '@dnd-kit-svelte/sortable';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';
  import type { TreeNode } from '$lib/models/Tree';
  import type { Filter } from '$lib/models/Filter';

  let isOpenAccess = $derived(page.url.pathname.includes('/discover'));
  let sensors = useSensors(useSensor(TouchSensor), useSensor(KeyboardSensor), useSensor(MouseSensor));
  let activeItem = $state<FilterInterface | FilterGroupInterface | undefined>(undefined);
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
      <DndContext {sensors}>
        <SortableContext items={$filterTree.root.children.map((child) => (child as FilterInterface).uuid)}>
          <FilterGroup group={$filterTree.root as FilterGroupInterface} />
        </SortableContext>

        <DragOverlay>
          {#if activeItem && $filterTree.isGroup(activeItem as TreeNode<FilterInterface>)}
            <FilterGroup group={activeItem as FilterGroupInterface} />
          {:else if activeItem && 'filter' in activeItem}
            <FilterComponent filter={activeItem.filter as Filter} />
          {/if}
        </DragOverlay>
      </DndContext>
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

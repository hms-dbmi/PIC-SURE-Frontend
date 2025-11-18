<script lang="ts">
  import { onDestroy } from 'svelte';
  // @ts-expect-error - sortablejs types are available but TypeScript may not resolve them correctly
  import Sortable from 'sortablejs';
  // @ts-expect-error - sortablejs types are available but TypeScript may not resolve them correctly
  import type { SortableEvent } from 'sortablejs';

  import type { Filter, FilterGroupInterface } from '$lib/models/Filter';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import OperatorDropdown from '$lib/components/explorer/results/OperatorDropdown.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';
  import { filterTree } from '$lib/stores/Filter';
  import { get } from 'svelte/store';
  import { genericUUID } from '$lib/utilities/UUID';

  let { group = $bindable() }: { group: FilterGroupInterface } = $props();
  let id = $derived(group.uuid.split('-')[0]);
  let containerElement: HTMLDivElement | undefined = $state();
  let sortableInstance: Sortable | undefined = $state();

  $effect(() => {
    if (containerElement && group.children.length > 1) {
      sortableInstance?.destroy();
      sortableInstance = new Sortable(containerElement, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'opacity-50',
        filter: '.operator-select',
        draggable: '.filter-item-container',
        onEnd: (event: SortableEvent) => {
          const { oldIndex, newIndex } = event;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

          const tree = get(filterTree);
          const movedChild = group.children[oldIndex];
          const targetChild = group.children[newIndex];

          if (movedChild && targetChild) {
            tree.reorderNodes(movedChild, targetChild);
            (tree.root as FilterGroupInterface).uuid = genericUUID();
            filterTree.set(tree);
          }
        },
      });
    }
  });

  onDestroy(() => {
    sortableInstance?.destroy();
  });
</script>

<div class={`filter-group-${group.operator.toLowerCase()}`} data-testid={`filter-group-${id}`}>
  {#key group.uuid}
    <div bind:this={containerElement} class="filter-group-children">
      {#each group.children as child, index}
        <div class="filter-item-container">
          {#if index > 0}
            <OperatorDropdown
              siblingA={group.children[index - 1]}
              siblingB={group.children[index]}
              operator={group.operator}
            />
          {/if}
          <div class="filter-item-wrapper">
            {#if group.children.length > 1}
              <i
                class="fa-solid fa-grip-vertical drag-handle cursor-move text-gray-400 hover:text-gray-600 mr-2"
                title="Drag to reorder"
              ></i>
            {/if}
            {#if child && 'children' in child}
              <FilterGroup group={child as FilterGroupInterface} />
            {:else}
              <FilterComponent filter={child as Filter} />
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/key}
</div>

<style>
  .filter-group-children {
    display: flex;
    flex-direction: column;
  }
  .filter-item-container {
    display: flex;
    flex-direction: column;
  }
  .filter-item-wrapper {
    display: flex;
    align-items: flex-start;
  }
</style>

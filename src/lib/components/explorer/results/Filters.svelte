<script lang="ts">
  import { page } from '$app/state';
  import { features } from '$lib/configuration';

  import type { FilterGroupInterface, FilterInterface } from '$lib/models/Filter';
  import type { TreeNode } from '$lib/models/Tree';
  import type { Filter } from '$lib/models/Filter';
  import { filterTree, filters, genomicFilters } from '$lib/stores/Filter';
  import { exports } from '$lib/stores/Export';

  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';

  import { type DragStartEvent, type DragOverEvent, type DragEndEvent } from '@dnd-kit-svelte/core';
  import {
    DndContext,
    DragOverlay,
    useSensors,
    useSensor,
    TouchSensor,
    KeyboardSensor,
    MouseSensor,
  } from '@dnd-kit-svelte/core';
  import { SortableContext } from '@dnd-kit-svelte/sortable';
  import { genericUUID } from '$lib/utilities/UUID';

  let isOpenAccess = $derived(page.url.pathname.includes('/discover'));
  let sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
    useSensor(MouseSensor),
  );
  let activeItem = $state<FilterInterface | FilterGroupInterface | undefined>(undefined);
  type DropZone = 'top' | 'middle' | 'bottom' | null;
  let hoverZone = $state<DropZone>(null);
  let hoverGroupId = $state<string | null>(null);
  let currentMouseY = $state<number>(0);
  

    function findContainer(id: string | number): FilterGroupInterface | null {
    const node = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === id);
    if (node && $filterTree.isGroup(node as TreeNode<FilterInterface>)) {
      return node as FilterGroupInterface;
    }
    return node?.parent as FilterGroupInterface;
  }

  function getDropZone(overGroupId: string | number): DropZone {
    // Find the DOM element for the group
    const elements = document.querySelectorAll('[data-sortable-id]');
    let groupElement: Element | undefined;
    
    elements.forEach((el) => {
      if (el.getAttribute('data-sortable-id') === String(overGroupId)) {
        groupElement = el;
      }
    });
    
    if (!groupElement) return 'middle';
    
    const rect = groupElement.getBoundingClientRect();
    const relativeY = currentMouseY - rect.top;
    const height = rect.height;
    const percentage = relativeY / height;
    
    // More generous middle zone for adding to group
    if (percentage < 0.2) return 'top';
    if (percentage > 0.8) return 'bottom';
    return 'middle';
  }

  function onDragStart({active}: DragStartEvent) {
    const node = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === active.id);
		if ($filterTree.isGroup(node as TreeNode<FilterInterface>)) {
			activeItem = node as FilterGroupInterface ?? null;
		} else {
			activeItem = node as FilterInterface ?? null;
		}
	}

  function onDragOver(event: DragOverEvent) {
    const {active, over} = event;
    if (!over || !active) {
      hoverZone = null;
      hoverGroupId = null;
      return;
    }

    const activeType = active.data?.type as 'item' | 'group' | undefined;
    const overType = over?.data?.type as 'item' | 'group' | 'root' | undefined;
    const acceptsItem = over?.data?.accepts?.includes('item') ?? false;

    // Detect zone when hovering over a group
    if (activeType === 'item' && overType === 'group') {
      const zone = getDropZone(over.id);
      hoverZone = zone;
      hoverGroupId = String(over.id);
      
      // Only move to container if in middle zone
      if (zone !== 'middle') {
        return; // Don't move yet, wait for onDragEnd
      }
    } else {
      hoverZone = null;
      hoverGroupId = null;
    }

    // Only move items between different containers
    if (activeType !== 'item') return;
    if (!overType && !acceptsItem) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const item = activeContainer.children.find((child) => ('uuid' in child) && (child as FilterInterface).uuid === active.id);
    if (!item) return;

    // Move item to new container (only happens for middle zone now)
    activeContainer.children = activeContainer.children.filter((child) => ('uuid' in child) && (child as FilterInterface).uuid !== active.id);
    overContainer.children.push(item as FilterInterface);
    (item as FilterInterface).parent = overContainer;
  }

  function onDragEnd({active, over}: DragEndEvent) {
    if (!over) {
      activeItem = undefined;
      hoverZone = null;
      hoverGroupId = null;
      return;
    }

    const activeType = active.data?.type as 'item' | 'group' | undefined;
    const overType = over?.data?.type as 'item' | 'group' | 'root' | undefined;

    // Handle group reordering
    if (activeType === 'group' && (overType === 'group' || overType === 'item')) {
      const activeNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === active.id);
      const overNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === over.id);
      
      if (activeNode && overNode) {
        $filterTree.reorderNodes(activeNode as FilterInterface, overNode as FilterInterface);
      }
    }
    
    // Handle item dropped on group in top/bottom zone (place before/after group)
    if (activeType === 'item' && overType === 'group' && (hoverZone === 'top' || hoverZone === 'bottom')) {
      const activeNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === active.id);
      const overNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === over.id);
      
      if (activeNode && overNode && overNode.parent) {
        const targetParent = overNode.parent as FilterGroupInterface;
        const currentParent = activeNode.parent as FilterGroupInterface | undefined;
        
        // Remove from current parent
        if (currentParent) {
          currentParent.children = currentParent.children.filter((child) => child !== activeNode);
          currentParent.uuid = genericUUID();
        }
        
        // Add to target parent at the correct position
        const overIndex = targetParent.children.indexOf(overNode as FilterInterface);
        
        if (hoverZone === 'bottom') {
          // Bottom zone: place AFTER the group
          targetParent.children.splice(overIndex + 1, 0, activeNode as FilterInterface);
        } else {
          // Top zone: place BEFORE the group
          targetParent.children.splice(overIndex, 0, activeNode as FilterInterface);
        }
        
        (activeNode as FilterInterface).parent = targetParent;
        targetParent.uuid = genericUUID();
      }
    }
    
    // Handle item reordering within same container
    if (activeType === 'item' && overType === 'item') {
      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (!activeContainer || !overContainer) {
        activeItem = undefined;
        hoverZone = null;
        hoverGroupId = null;
        return;
      }

      if (activeContainer === overContainer) {
        // Same container reorder
        const activeNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === active.id);
        const overNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === over.id);
        
        if (activeNode && overNode) {
          $filterTree.reorderNodes(activeNode as FilterInterface, overNode as FilterInterface);
          activeContainer.uuid = genericUUID();
        }
      } else {
        // Cross-container move was handled by onDragOver
        if (activeContainer) activeContainer.uuid = genericUUID();
        if (overContainer) overContainer.uuid = genericUUID();
      }
    }

    // Handle item dropped on group in middle zone (add to group, handled by onDragOver)
    if (activeType === 'item' && overType === 'group' && hoverZone === 'middle') {
      const activeNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === active.id);
      const overNode = $filterTree.find((n) => ('uuid' in (n as FilterInterface)) && (n as FilterInterface).uuid === over.id);
      
      if (activeNode?.parent && overNode && $filterTree.isGroup(overNode)) {
        (activeNode.parent as FilterGroupInterface).uuid = genericUUID();
        (overNode as FilterGroupInterface).uuid = genericUUID();
      }
    }

    activeItem = undefined;
    hoverZone = null;
    hoverGroupId = null;
    $filterTree.pruneTree();
    ($filterTree.root as FilterGroupInterface).uuid = genericUUID();
    filterTree.set($filterTree);
  }
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
        <DndContext {sensors} {onDragStart} {onDragEnd} {onDragOver}>
          <SortableContext
            items={$filterTree.root.children.map((child) => (child as FilterInterface).uuid)}
          >
            <FilterGroup group={$filterTree.root as FilterGroupInterface} />
          </SortableContext>
          <DragOverlay>
            {#if activeItem && $filterTree.isGroup(activeItem as TreeNode<FilterInterface>)}
              <FilterGroup group={activeItem as FilterGroupInterface} />
            {:else if activeItem}
              <FilterComponent filter={activeItem as Filter} />
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

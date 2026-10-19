<script lang="ts">
  import OperatorBadge from '#lib/ui/OperatorBadge.svelte';
  import {
    type FilterInterface,
    type FilterGroupInterface,
    isFilterGroup,
    createFilterGroup,
  } from '#lib/query/filter.svelte.ts';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import AdvancedItem from './AdvancedItem.svelte';
  import GroupDropZone from './GroupDropZone.svelte';
  import SortableProvider from '#lib/ui/sortable/SortableProvider.svelte';
  import {
    DragOverlay,
    move,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
  } from '#lib/ui/sortable/sortable.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { LogicTree } from '#lib/query/logicTree.svelte.ts';
  import { Operator, type OperatorType } from '#lib/query/query.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import LogicTreeSummary from './LogicTreeSummary.svelte';
  import { cardClass } from '#lib/ui/surface.ts';
  import {
    applyDrop,
    applyOrder,
    classifyDrop,
    projectDragOver,
    type DropZoneData,
    type OrderMap,
  } from './filterTreeOps.ts';

  let activeNode: FilterInterface | null = $state(null);
  let activeId: string | null = $state(null);
  // True when actively dragging a group (not an item)
  const isGroupDrag = $derived.by(() => {
    if (!activeNode) return false;
    return isFilterGroup(activeNode);
  });
  let projectedOrder: OrderMap | null = $state(null);
  // Store the last valid projectedOrder so it's available in handleDragEnd
  let lastValidProjectedOrder: OrderMap | null = $state(null);
  let dragStartSnapshot: string | null = $state(null);
  let hasOptimisticReorder = $state(false);
  // Track if actual drag movement occurred (not just a click)
  let hasDragMovement = $state(false);

  const localTree = (() => {
    try {
      return filterState.tree.clone();
    } catch (e) {
      console.error('Failed to clone filter tree:', e);
      toaster.error({ description: 'Failed to load saved filter arrangement. Starting fresh.' });
      return new LogicTree<FilterInterface>((nodes, op) => createFilterGroup(nodes, op));
    }
  })();

  let savedSerialized = $state(filterState.tree.serialized);

  function handleDragStart(event: DragStartEvent) {
    const active = event.operation.source;
    if (!active) return;
    const id = String(active.id);
    const node = localTree.find((n) => n.uuid === id);
    activeId = id;
    if (node) activeNode = node;
    dragStartSnapshot = localTree.serialized;
    hasOptimisticReorder = false;
    hasDragMovement = false;
  }

  function clearDragState() {
    activeNode = null;
    activeId = null;
    projectedOrder = null;
    lastValidProjectedOrder = null;
    dragStartSnapshot = null;
    hasOptimisticReorder = false;
    hasDragMovement = false;
  }

  function restoreSnapshot() {
    if (!dragStartSnapshot) return;
    localTree.root = LogicTree.deserialize<FilterInterface>(dragStartSnapshot, (nodes, op) =>
      createFilterGroup(nodes, op),
    ).root;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source, target } = event.operation;
    const op = classifyDrop(localTree, activeNode, {
      sourceId: source?.id ? String(source.id) : null,
      targetId: target?.id ? String(target.id) : null,
      targetData: target?.data as DropZoneData | undefined,
      canceled: event.canceled,
      moved: hasDragMovement,
      reordered: hasOptimisticReorder,
    });

    try {
      // Always restore to pre-drag state first, so every path
      // below mutates from a known-clean starting point.
      restoreSnapshot();

      // Re-resolve activeNode in the restored tree since restoreSnapshot
      // replaced all nodes, making the old reference stale.
      if (activeId) {
        const freshNode = localTree.find((n) => n.uuid === activeId);
        if (freshNode) activeNode = freshNode;
      }

      if (activeNode) {
        // Sortable sources carry their final index; plain draggables don't.
        const index = (source as { index?: unknown } | null)?.index;
        applyDrop(localTree, activeNode, op, {
          projected: projectedOrder,
          lastProjected: lastValidProjectedOrder,
          sourceIndex: typeof index === 'number' ? index : undefined,
        });
      }
    } finally {
      clearDragState();
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { source, target } = event.operation;
    const result = projectDragOver(
      localTree,
      activeNode,
      {
        sourceId: source ? String(source.id) : null,
        targetId: target ? String(target.id) : null,
        targetData: target?.data as DropZoneData | undefined,
      },
      (order) => move(order, event),
    );

    if (result.type === 'clear') {
      projectedOrder = null;
    } else if (result.type === 'project') {
      projectedOrder = result.order;
      lastValidProjectedOrder = result.order;
      hasOptimisticReorder = true;
      hasDragMovement = true; // Mark that real drag movement occurred
      if (activeNode) applyOrder(localTree, activeNode, result.order);
    }
  }

  function addGroup() {
    const newGroup = createFilterGroup([], Operator.AND);
    localTree.add(newGroup);
  }

  function removeGroup(group: FilterGroupInterface) {
    localTree.remove(group);
  }

  function handleOperatorChange(group: FilterGroupInterface, newOperator: OperatorType) {
    (group as FilterGroupInterface).setOperator(newOperator);
  }

  export function applyChanges() {
    localTree.pruneTree();
    filterState.setTree(localTree.clone());
    savedSerialized = localTree.serialized;
  }

  export function hasUnsavedChanges(): boolean {
    return localTree.serialized !== savedSerialized;
  }

  function removeNode(filter: FilterInterface) {
    localTree.remove(filter);
  }
</script>

<LogicTreeSummary
  root={localTree.root as FilterGroupInterface}
  genomicFilters={filterState.genomic}
/>
<div class="flex-1 overflow-auto p-2 border border-surface-300 rounded-lg bg-surface-50 w-full">
  <SortableProvider
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    onDragOver={handleDragOver}
  >
    <AdvancedGroup
      group={localTree.root as FilterGroupInterface}
      id="root"
      onRemove={removeGroup}
      onRemoveChild={removeNode}
      isOverlay={false}
      {activeId}
      {isGroupDrag}
      onOperatorChange={handleOperatorChange}
      onAddGroup={addGroup}
    />
    <!-- Root-level drop zone for un-nesting groups; hidden when dragged group is already at root -->
    {#if !(isGroupDrag && activeNode?.parent === localTree.root)}
      <GroupDropZone groupId="root" {isGroupDrag} isOverlay={false} />
    {/if}
    <DragOverlay>
      {#if activeNode && isFilterGroup(activeNode)}
        <AdvancedGroup
          group={activeNode as FilterGroupInterface}
          onRemove={removeGroup}
          onRemoveChild={removeNode}
          isOverlay={true}
          onOperatorChange={handleOperatorChange}
        />
      {:else if activeNode}
        <AdvancedItem filter={activeNode} isOverlay={true} onRemove={removeNode} />
      {/if}
    </DragOverlay>
  </SortableProvider>
  {#if filterState.genomic.length > 0}
    <div data-testid="filter-genomic-section">
      {#if (localTree.root as FilterGroupInterface).children.length > 0}
        <div class="flex justify-center pb-3" data-testid="filter-genomic-separator">
          <OperatorBadge operator="AND" tone="neutral" />
        </div>
      {/if}
      {#each filterState.genomic as gFilter (gFilter.id)}
        <div
          class="{cardClass} flex flex-row gap-2 items-center p-4 bg-white opacity-75"
          data-testid="filter-genomic-item"
        >
          <div class="flex items-center">
            <i class="fa-solid fa-dna text-surface-400"></i>
          </div>
          <div class="flex flex-col">
            <div class="text-sm font-medium">{gFilter.variableName}</div>
            {#if gFilter.description}
              <div class="text-xs text-surface-500">{gFilter.description}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

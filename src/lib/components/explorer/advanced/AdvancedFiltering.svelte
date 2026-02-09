<script lang="ts">
  import type { FilterInterface } from '$lib/models/Filter.svelte';
  import type { FilterGroupInterface } from '$lib/models/Filter.svelte';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import AdvancedItem from './AdvancedItem.svelte';
  import GroupDropZone from './GroupDropZone.svelte';
  import {
    DragDropProvider,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
  } from '@dnd-kit-svelte/svelte';
  import { move } from '@dnd-kit/helpers';
  import { filterTree } from '$lib/stores/Filter';
  import { Tree, type TreeNode } from '$lib/models/Tree.svelte';
  import { createFilterGroup } from '$lib/models/Filter.svelte';
  import { Operator } from '$lib/models/query/Query';

  let activeNode: FilterInterface | null = $state(null);
  let activeId: string | null = $state(null);
  // True when actively dragging a group (not an item)
  const isGroupDrag = $derived.by(() => {
    if (!activeNode) return false;
    return (activeNode as FilterInterface).filterType === 'FilterGroup';
  });
  let operatorPreview: { parentId: string | undefined; index: number } | null = $state(null);
  let projectedOrder: Record<string, string[]> | null = $state(null);
  // Store the last valid projectedOrder so it's available in handleDragEnd
  let lastValidProjectedOrder: Record<string, string[]> | null = $state(null);
  let dragStartSnapshot: string | null = $state(null);
  let hasOptimisticReorder = $state(false);
  // Track if actual drag movement occurred (not just a click)
  let hasDragMovement = $state(false);

  // Initialize a local reactive tree.
  // We clone the global tree's structure initially.
  // Note: Deep cloning might be needed if children are objects that shouldn't share references, 
  // but for now we assume Tree.deserialize or similar logic is best if we want full isolation.
  // However, since Tree is now a class with $state, we should probably construct a new one.
  // For this fix, let's create a new Tree instance and initialize it with the current global root.
  // Important: If we want true isolation, we should clone the data.
  
  const localTree = new Tree<FilterInterface>(() => createFilterGroup([], Operator.AND));
  // We need to clone the structure to avoid modifying the global store directly by reference.
  // Using serialization/deserialization is a safe way to clone the tree structure.
  localTree.root = Tree.deserialize<FilterInterface>($filterTree.serialized, (nodes, op) => createFilterGroup(nodes as FilterInterface[], op)).root;

  const sensors = [KeyboardSensor, PointerSensor];

  function getGroupNodeByContainerId(containerId: string | undefined) {
    if (!containerId) return null;
    if (containerId === 'root') return localTree.root as FilterGroupInterface;
    const node = localTree.find((n) => (n as FilterInterface).uuid === containerId);
    return node && (node as FilterInterface).filterType === 'FilterGroup'
      ? (node as FilterGroupInterface)
      : null;
  }

  function containerIdForTreeParent(parent: any) {
    if (!parent) return undefined;
    return parent === localTree.root ? 'root' : String(parent.uuid);
  }

  function buildSortableOrder(): Record<string, string[]> {
    const order: Record<string, string[]> = {};
    const walk = (group: FilterGroupInterface, containerId: string) => {
      order[containerId] = group.children.map((child) => (child as FilterInterface).uuid);
      group.children.forEach((child) => {
        if ((child as FilterInterface).filterType === 'FilterGroup') {
          walk(child as FilterGroupInterface, (child as FilterInterface).uuid);
        }
      });
    };
    walk(localTree.root as FilterGroupInterface, 'root');
    return order;
  }

  function handleDragStart(event: any) {
    const active = event.operation.source;
    if (!active) return;
    const id = String(active.id);
    const node = localTree.find((n) => (n as FilterInterface).uuid === id);
    activeId = id;
    if (node) activeNode = node as FilterInterface;
    dragStartSnapshot = localTree.serialized;
    hasOptimisticReorder = false;
    hasDragMovement = false;
  }

  function clearDragState() {
    activeNode = null;
    activeId = null;
    operatorPreview = null;
    projectedOrder = null;
    lastValidProjectedOrder = null;
    dragStartSnapshot = null;
    hasOptimisticReorder = false;
    hasDragMovement = false;
  }

  function removeFromParent(node: FilterInterface, parent: FilterGroupInterface) {
    parent.children = parent.children.filter(
      (child) => (child as FilterInterface).uuid !== node.uuid
    );
  }

  function insertAtIndex(
    node: FilterInterface,
    group: FilterGroupInterface,
    index: number
  ) {
    node.parent = group;
    group.children = [
      ...group.children.slice(0, index),
      node,
      ...group.children.slice(index),
    ];
  }

  function handleEmptyDropZone(targetId: string): boolean {
    if (!targetId.startsWith('empty-') || !activeNode) return false;

    const targetGroupId = targetId.replace('empty-', '');
    const targetGroup = getGroupNodeByContainerId(targetGroupId);
    if (!targetGroup) return false;

    const oldParent = activeNode.parent as FilterGroupInterface | null;
    if (oldParent) removeFromParent(activeNode, oldParent);
    insertAtIndex(activeNode, targetGroup, targetGroup.children.length);
    return true;
  }

  function handleGroupDropZone(targetId: string): boolean {
    if (!targetId.startsWith('drop-') || !activeNode) return false;

    const targetGroupId = targetId.replace('drop-', '');
    const targetGroup = getGroupNodeByContainerId(targetGroupId);
    if (!targetGroup) return false;

    // Don't allow dropping a group into itself or its descendants
    if (activeNode.filterType === 'FilterGroup') {
      let checkNode: FilterGroupInterface | null = targetGroup;
      while (checkNode) {
        if (checkNode.uuid === activeNode.uuid) return false;
        checkNode = checkNode.parent as FilterGroupInterface | null;
      }
    }

    const oldParent = activeNode.parent as FilterGroupInterface | null;
    if (oldParent) removeFromParent(activeNode, oldParent);
    insertAtIndex(activeNode, targetGroup, targetGroup.children.length);
    return true;
  }

  function isDropZoneTarget(targetId: string): boolean {
    return targetId.startsWith('empty-') || targetId.startsWith('drop-');
  }

  function getDropZoneGroupId(target: any, targetId: string): string | null {
    if (target?.data?.targetGroupId) return String(target.data.targetGroupId);
    if (targetId.startsWith('empty-')) return targetId.replace('empty-', '');
    if (targetId.startsWith('drop-')) return targetId.replace('drop-', '');
    return null;
  }

  function findDropDestination(targetId: string): {
    group: FilterGroupInterface;
    index: number;
  } | null {
    const targetNode = localTree.find(
      (n) => (n as FilterInterface).uuid === targetId
    );
    if (!targetNode) return null;

    const isTargetAGroup =
      (targetNode as FilterInterface).filterType === 'FilterGroup';

    if (isTargetAGroup) {
      const group = targetNode as FilterGroupInterface;
      return { group, index: group.children.length };
    }

    const parentGroup = targetNode.parent as FilterGroupInterface | null;
    if (!parentGroup) return null;

    const targetIndex = parentGroup.children.findIndex(
      (child) => (child as FilterInterface).uuid === targetId
    );
    return {
      group: parentGroup,
      index: targetIndex !== -1 ? targetIndex + 1 : parentGroup.children.length,
    };
  }

  function handleCrossGroupOrReorder(targetId: string): boolean {
    if (!activeNode) return false;

    // If dropped on itself, do nothing (this happens on click without drag)
    if (targetId === activeNode.uuid) return false;

    const destination = findDropDestination(targetId);
    if (!destination) return false;

    const { group: destinationGroup, index: insertIndex } = destination;
    const activeParent = activeNode.parent as FilterGroupInterface | null;
    if (!activeParent) return false;

    // Don't allow dropping a group into itself
    if (destinationGroup === activeNode) return false;

    const activeUuid = activeNode.uuid;
    const isCrossGroup = destinationGroup !== activeParent;
    const isSameGroupReorder = !isCrossGroup && targetId !== activeUuid;

    if (isCrossGroup) {
      removeFromParent(activeNode, activeParent);
      insertAtIndex(activeNode, destinationGroup, insertIndex);
      return true;
    }

    if (isSameGroupReorder) {
      const currentIndex = destinationGroup.children.findIndex(
        (child) => (child as FilterInterface).uuid === activeUuid
      );

      const noMovementNeeded =
        currentIndex === -1 ||
        currentIndex === insertIndex ||
        currentIndex === insertIndex - 1;
      if (noMovementNeeded) return false;

      const withoutActive = destinationGroup.children.filter(
        (child) => (child as FilterInterface).uuid !== activeUuid
      );
      const adjustedIndex =
        currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
      destinationGroup.children = [
        ...withoutActive.slice(0, adjustedIndex),
        activeNode,
        ...withoutActive.slice(adjustedIndex),
      ];
      return true;
    }

    return false;
  }

  function calculateOrderFromSource(source: any): Record<string, string[]> | null {
    if (!activeNode || !source) return null;

    const activeUuid = activeNode.uuid;
    const sourceIndex =
      typeof source.index === 'function' ? source.index() : source.index;
    const activeParentGroup = activeNode.parent
      ? containerIdForTreeParent(activeNode.parent)
      : undefined;

    if (!activeParentGroup || typeof sourceIndex !== 'number') return null;

    const group = getGroupNodeByContainerId(activeParentGroup);
    if (!group) return null;

    const currentIndex = group.children.findIndex(
      (c) => (c as FilterInterface).uuid === activeUuid
    );
    if (currentIndex === sourceIndex) return null;

    const currentOrder = group.children.map((c) => (c as FilterInterface).uuid);
    const withoutActive = currentOrder.filter((id) => id !== activeUuid);
    const clampedIndex = Math.max(
      0,
      Math.min(sourceIndex, withoutActive.length)
    );
    withoutActive.splice(clampedIndex, 0, activeUuid);

    return { [activeParentGroup]: withoutActive };
  }

  function applyProjectedOrder(order: Record<string, string[]>) {
    if (!activeNode) return;

    const activeUuid = activeNode.uuid;
    const oldParent = activeNode.parent as FilterGroupInterface | null;
    let removedFromOldParent = false;

    for (const [containerId, orderedIds] of Object.entries(order)) {
      const group = getGroupNodeByContainerId(containerId);
      if (!group) continue;

      const nodeMap = new Map(
        group.children.map((child) => [
          (child as FilterInterface).uuid,
          child as TreeNode<FilterInterface>,
        ])
      );

      const needsToMoveHere =
        orderedIds.includes(activeUuid) && !nodeMap.has(activeUuid);
      if (needsToMoveHere) {
        nodeMap.set(activeUuid, activeNode as TreeNode<FilterInterface>);

        if (!removedFromOldParent && oldParent && oldParent !== group) {
          const oldIndex = oldParent.children.findIndex(
            (child) => (child as FilterInterface).uuid === activeUuid
          );
          if (oldIndex !== -1) {
            oldParent.children.splice(oldIndex, 1);
            oldParent.children = [...oldParent.children];
          }
          removedFromOldParent = true;
        }

        activeNode.parent = group;
      }

      const reorderedChildren = orderedIds
        .map((uuid) => nodeMap.get(uuid))
        .filter((node): node is TreeNode<FilterInterface> => node !== undefined)
        .map((node) => {
          (node as FilterInterface).parent = group;
          return node as FilterInterface;
        });

      group.children = reorderedChildren;
    }
  }

  function handleDragEnd(event: any) {
    const operation = event?.operation;
    const source = operation?.source;
    const target = operation?.target;
    let targetId = target?.id ? String(target.id) : null;
    const canceled = event?.canceled ?? operation?.canceled;

    const sourceId = source?.id ? String(source.id) : null;

    // Ignore dropping on own dropzone (can't nest into yourself)
    if (targetId && isDropZoneTarget(targetId) && targetId === `drop-${sourceId}`) {
      // Don't treat this as a dropzone drop - fall through to other handling
      targetId = null;
    }

    if (canceled && dragStartSnapshot) {
      localTree.root = Tree.deserialize<FilterInterface>(
        dragStartSnapshot,
        (nodes, op) => createFilterGroup(nodes as FilterInterface[], op)
      ).root;
      clearDragState();
      return;
    }

    // Check if this looks like a click on the parent container (no real drag movement)
    const activeParentId = activeNode?.parent
      ? containerIdForTreeParent(activeNode.parent)
      : undefined;
    const isClickOnParentContainer = targetId === activeParentId || targetId === 'root';

    // For clicks (no drag movement) on parent container, restore original state to prevent spurious reordering
    // If hasDragMovement is true, this is a real drag and we should keep the changes
    if (isClickOnParentContainer && !hasDragMovement && dragStartSnapshot) {
      localTree.root = Tree.deserialize<FilterInterface>(
        dragStartSnapshot,
        (nodes, op) => createFilterGroup(nodes as FilterInterface[], op)
      ).root;
      clearDragState();
      return;
    }

    // Handle drop zones first (they have priority over optimistic reorder)
    if (targetId && handleEmptyDropZone(targetId)) {
      clearDragState();
      return;
    }

    if (targetId && handleGroupDropZone(targetId)) {
      clearDragState();
      return;
    }

    // Check for cross-group drops - these need special handling even if optimistic reorder occurred
    // because move() doesn't handle cross-group moves correctly
    if (targetId && activeNode) {
      const targetNode = localTree.find((n) => (n as FilterInterface).uuid === targetId);
      if (targetNode) {
        const targetParent = targetNode.parent as FilterGroupInterface | null;
        const activeParent = activeNode.parent as FilterGroupInterface | null;
        // If target is in a different group, or target IS a group, handle as cross-group
        const isCrossGroupTarget = targetParent && activeParent && targetParent !== activeParent;
        const isGroupTarget = (targetNode as FilterInterface).filterType === 'FilterGroup';
        if (isCrossGroupTarget || isGroupTarget) {
          if (handleCrossGroupOrReorder(targetId)) {
            clearDragState();
            return;
          }
        }
      }
    }

    if (hasOptimisticReorder) {
      clearDragState();
      return;
    }

    let finalProjectedOrder = projectedOrder || lastValidProjectedOrder;

    if (!finalProjectedOrder && targetId && handleCrossGroupOrReorder(targetId)) {
      clearDragState();
      return;
    }

    if (!finalProjectedOrder) {
      finalProjectedOrder = calculateOrderFromSource(source);
    }

    if (!finalProjectedOrder && activeNode?.parent) {
      const parent = activeNode.parent as FilterGroupInterface;
      parent.children = [...parent.children];
    }

    if (finalProjectedOrder) {
      applyProjectedOrder(finalProjectedOrder);
    }

    clearDragState();
  }

  function handleDragOver(event: any) {
    const operation = event?.operation;
    const source = operation?.source;
    const target = operation?.target;

    if (!source || !target) {
      operatorPreview = null;
      projectedOrder = null;
      return;
    }

    let targetId = String(target.id);
    let isDropZone = isDropZoneTarget(targetId);
    const sourceId = String(source.id);

    // Ignore dropzones that belong to the dragged item itself (can't nest into yourself)
    if (isDropZone && targetId === `drop-${sourceId}`) {
      // Clear any projected reorder - we don't want to apply changes when over own dropzone
      projectedOrder = null;
      return;
    }

    const baseOrder = buildSortableOrder();
    let nextOrder = baseOrder;

    if (isDropZone) {
      const targetGroupId = getDropZoneGroupId(target, targetId);
      if (!targetGroupId) return;

      const activeUuid = String(source.id);

      nextOrder = { ...baseOrder };
      for (const [containerId, ids] of Object.entries(baseOrder)) {
        nextOrder[containerId] = ids.filter((id) => id !== activeUuid);
      }

      if (!nextOrder[targetGroupId]) {
        nextOrder[targetGroupId] = [];
      }
      if (!nextOrder[targetGroupId].includes(activeUuid)) {
        nextOrder[targetGroupId] = [...nextOrder[targetGroupId], activeUuid];
      }
    } else {
      nextOrder = move(baseOrder, event);
    }

    if (nextOrder !== baseOrder) {
      // Check if the source item actually moved to a different position
      const sourceId = String(source.id);
      let sourceActuallyMoved = false;

      // Compare source position in baseOrder vs nextOrder
      for (const [containerId, ids] of Object.entries(nextOrder)) {
        const baseIds = baseOrder[containerId] || [];
        const baseIndex = baseIds.indexOf(sourceId);
        const nextIndex = ids.indexOf(sourceId);

        // If source moved to this container or moved within this container
        if (nextIndex !== -1 && (baseIndex !== nextIndex || !baseOrder[containerId]?.includes(sourceId))) {
          sourceActuallyMoved = true;
          break;
        }
      }

      // Only apply optimistic reorder if source actually moved
      if (sourceActuallyMoved) {
        projectedOrder = nextOrder;
        lastValidProjectedOrder = nextOrder;
        hasOptimisticReorder = true;
        hasDragMovement = true;  // Mark that real drag movement occurred
        applyProjectedOrder(nextOrder);
      }
    }
  }

  function addGroup() {
    const newGroup = createFilterGroup([], Operator.AND);
    localTree.add(newGroup);
  }

  function removeGroup(group: FilterGroupInterface) {
    localTree.remove(group);
  }

  function handleOperatorChange(group: FilterGroupInterface, newOperator: any) {
    (group as FilterGroupInterface).setOperator(newOperator);
  }
  
  export function applyChanges() {
      filterTree.set(localTree);
  }

  function removeNode(filter: FilterInterface) {
    localTree.remove(filter);
  }
</script>

<div class="mb-2 flex justify-end gap-2">
  <button class="btn preset-filled-primary-500" onclick={addGroup}>Add Group</button>
</div>
<div class="flex-1 overflow-auto p-4 border border-surface-300 rounded-lg bg-surface-50">
  <DragDropProvider {sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
    <AdvancedGroup
        group={localTree.root as FilterGroupInterface}
        id="root"
        onRemove={removeGroup}
        onRemoveChild={removeNode}
        isOverlay={false}
        {activeId}
        {isGroupDrag}
        onOperatorChange={handleOperatorChange}
    />
    <!-- Root-level drop zone for un-nesting groups -->
    <GroupDropZone
      groupId="root"
      {isGroupDrag}
      isActive={activeId !== null}
      index={(localTree.root as FilterGroupInterface).children.length}
      isOverlay={false}
      {activeId}
    />
    <DragOverlay>
      {#if activeNode && (activeNode as FilterInterface | FilterGroupInterface).filterType === 'FilterGroup'}
        <AdvancedGroup 
            bind:group={activeNode as FilterGroupInterface} 
            onRemove={removeGroup}
            onRemoveChild={removeNode}
            isOverlay={true}
            onOperatorChange={handleOperatorChange}
        />
      {:else if activeNode}
        <AdvancedItem filter={activeNode as FilterInterface} isOverlay={true} onRemove={removeNode} />
      {/if} 
    </DragOverlay>
  </DragDropProvider>
</div>
<button class="btn preset-filled-primary-500" onclick={applyChanges}>Apply Changes</button>

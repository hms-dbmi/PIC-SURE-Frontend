<script lang="ts">
  import type { FilterInterface } from '$lib/models/Filter.svelte';
  import type { FilterGroupInterface } from '$lib/models/Filter.svelte';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import AdvancedItem from './AdvancedItem.svelte';
  import {
    DragDropProvider,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
  } from '@dnd-kit-svelte/svelte';
  import { filterTree } from '$lib/stores/Filter';
  import { Tree, type TreeNode } from '$lib/models/Tree.svelte';
  import { createFilterGroup } from '$lib/models/Filter.svelte';
  import { Operator } from '$lib/models/query/Query';

  let activeNode: FilterInterface | null = $state(null);
  let activeId: string | null = $state(null);
  let operatorPreview: { parentId: string | undefined; index: number } | null = $state(null);
  let projectedOrder: Record<string, string[]> | null = $state(null);
  // Store the last valid projectedOrder so it's available in handleDragEnd
  let lastValidProjectedOrder: Record<string, string[]> | null = $state(null);

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

  function handleDragStart(event: any) {
    const active = event.operation.source;
    if (!active) return;
    const id = String(active.id);
    const node = localTree.find((n) => (n as FilterInterface).uuid === id);
    activeId = id;
    if (node) activeNode = node as FilterInterface;
  }

  function clearDragState() {
    activeNode = null;
    activeId = null;
    operatorPreview = null;
    projectedOrder = null;
    lastValidProjectedOrder = null;
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

    const destination = findDropDestination(targetId);
    if (!destination) return false;

    const { group: destinationGroup, index: insertIndex } = destination;
    const activeParent = activeNode.parent as FilterGroupInterface | null;
    if (!activeParent) return false;

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
    const targetId = target?.id ? String(target.id) : null;

    if (targetId && handleEmptyDropZone(targetId)) {
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
    const active = event?.operation?.source;
    const over = event?.operation?.over;
    
    if (!active || !over) {
      operatorPreview = null;
      projectedOrder = null;
      return;
    }

    const activeUuid = String(active.id);
    const overIndex = Number(over.index);
    if (!Number.isFinite(overIndex)) {
      operatorPreview = null;
      projectedOrder = null;
      return;
    }

    const activeContainerId =
      active.group ? String(active.group) : containerIdForTreeParent(activeNode?.parent);
    
    // Handle empty drop zones: their id is "empty-{groupId}" and they store targetGroupId in data
    const overId = String(over.id);
    const isEmptyDropZone = overId.startsWith('empty-');
    
    // Look up the target node in tree to determine if it's a group
    const overNode = localTree.find((n) => (n as FilterInterface).uuid === overId);
    const isOverAGroup = overNode && (overNode as FilterInterface).filterType === 'FilterGroup';
    
    
    // When dragging over a GROUP (not an item), drop INTO that group
    // The group's own ID should be the container, not its parent
    const overContainerId = isEmptyDropZone
      ? over.data?.targetGroupId ? String(over.data.targetGroupId) : overId.replace('empty-', '')
      : isOverAGroup
        ? String(over.id)
        : over.group
          ? String(over.group)
          : over.parentId
            ? String(over.parentId)
            : over.containerId
              ? String(over.containerId)
              : undefined;
    
    operatorPreview = {
      parentId: overContainerId,
      index: overIndex,
    };


    const activeGroup = getGroupNodeByContainerId(activeContainerId);
    const overGroup = getGroupNodeByContainerId(overContainerId);
    if (!activeGroup || !overGroup) {
      projectedOrder = null;
      return;
    }

    const activeIds = activeGroup.children.map((c) => c.uuid);
    const overIds = overGroup.children.map((c) => c.uuid);

    const next: Record<string, string[]> = {};
    if (activeContainerId && activeContainerId === overContainerId) {
      const without = activeIds.filter((id) => id !== activeUuid);
      const clamped = Math.max(0, Math.min(overIndex, without.length));
      without.splice(clamped, 0, activeUuid);
      next[activeContainerId] = without;
    } else {
      if (activeContainerId) next[activeContainerId] = activeIds.filter((id) => id !== activeUuid);
      if (overContainerId) {
        const without = overIds.filter((id) => id !== activeUuid);
        const clamped = Math.max(0, Math.min(overIndex, without.length));
        without.splice(clamped, 0, activeUuid);
        next[overContainerId] = without;
      }
    }
    projectedOrder = next;
    // Store the last valid projectedOrder
    if (next && Object.keys(next).length > 0) {
      lastValidProjectedOrder = next;
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
        onOperatorChange={handleOperatorChange}
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
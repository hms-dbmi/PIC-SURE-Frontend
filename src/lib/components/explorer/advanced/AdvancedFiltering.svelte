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

  function handleDragEnd(event: any) {
    // Use lastValidProjectedOrder if projectedOrder is null (it might have been cleared)
    let finalProjectedOrder = projectedOrder || lastValidProjectedOrder;
    
    // Also try to get order from the event if available
    const operation = event?.operation;
    const source = operation?.source;
    const over = operation?.over;
    const target = operation?.target;
    
    // Handle drops on EmptyDropZone - the target id will be "empty-{groupId}"
    const targetId = target?.id ? String(target.id) : null;
    if (targetId && targetId.startsWith('empty-') && activeNode) {
      const targetGroupId = targetId.replace('empty-', '');
      const targetGroup = getGroupNodeByContainerId(targetGroupId);
      
      if (targetGroup) {
        const activeUuid = (activeNode as FilterInterface).uuid;
        const oldParent = activeNode.parent as FilterGroupInterface | null;
        
        // Update parent reference first
        activeNode.parent = targetGroup;
        
        // Remove from old parent using immutable pattern
        if (oldParent) {
          oldParent.children = oldParent.children.filter(
            child => (child as FilterInterface).uuid !== activeUuid
          );
        }
        
        // Add to new group
        targetGroup.children = [...targetGroup.children, activeNode as FilterInterface];
        
        // Clear state and return early
        activeNode = null;
        activeId = null;
        operatorPreview = null;
        projectedOrder = null;
        lastValidProjectedOrder = null;
        return;
      }
    }
    
    // Handle cross-group drops when over is null but target exists (group isolation workaround)
    // This happens when dragging from one group to another - dnd-kit doesn't populate 'over' for cross-group
    if (!finalProjectedOrder && targetId && activeNode) {
      // Find the target node and its parent group
      const targetNode = localTree.find((n) => (n as FilterInterface).uuid === targetId);
      if (targetNode) {
        const targetFilter = targetNode as FilterInterface;
        const isTargetAGroup = targetFilter.filterType === 'FilterGroup';
        const activeParent = activeNode.parent as FilterGroupInterface | null;
        
        // If target is a group, we want to drop INTO it (at the end)
        // If target is an item, we want to drop AFTER it in the same container
        let destinationGroup: FilterGroupInterface | null;
        let insertIndex: number;
        
        if (isTargetAGroup) {
          // Drop INTO the target group
          destinationGroup = targetNode as FilterGroupInterface;
          insertIndex = destinationGroup.children.length;
        } else {
          // Drop AFTER the target item in its parent
          destinationGroup = targetNode.parent as FilterGroupInterface | null;
          if (destinationGroup) {
            const targetIndex = destinationGroup.children.findIndex(
              child => (child as FilterInterface).uuid === targetId
            );
            insertIndex = targetIndex !== -1 ? targetIndex + 1 : destinationGroup.children.length;
          } else {
            insertIndex = 0;
          }
        }
        
        // Process cross-group moves OR same-group reordering (when target !== source)
        if (destinationGroup && activeParent) {
          const activeUuid = (activeNode as FilterInterface).uuid;
          const isCrossGroup = destinationGroup !== activeParent;
          const isSameGroupReorder = !isCrossGroup && targetId !== activeUuid;
          
          if (isCrossGroup) {
            // Cross-group move: remove from old, add to new
            activeNode.parent = destinationGroup;
            
            activeParent.children = activeParent.children.filter(
              child => (child as FilterInterface).uuid !== activeUuid
            );
            
            destinationGroup.children = [
              ...destinationGroup.children.slice(0, insertIndex),
              activeNode as FilterInterface,
              ...destinationGroup.children.slice(insertIndex)
            ];
            
            activeNode = null;
            activeId = null;
            operatorPreview = null;
            projectedOrder = null;
            lastValidProjectedOrder = null;
            return;
          } else if (isSameGroupReorder) {
            // Same-group reorder: remove from current position, insert at new position
            const currentIndex = destinationGroup.children.findIndex(
              child => (child as FilterInterface).uuid === activeUuid
            );
            
            if (currentIndex !== -1 && currentIndex !== insertIndex && currentIndex !== insertIndex - 1) {
              // Remove from current position
              const withoutActive = destinationGroup.children.filter(
                child => (child as FilterInterface).uuid !== activeUuid
              );
              
              // Adjust insert index if we removed from before the insert point
              const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
              
              // Insert at new position
              destinationGroup.children = [
                ...withoutActive.slice(0, adjustedIndex),
                activeNode as FilterInterface,
                ...withoutActive.slice(adjustedIndex)
              ];
            }
            
            activeNode = null;
            activeId = null;
            operatorPreview = null;
            projectedOrder = null;
            lastValidProjectedOrder = null;
            return;
          }
        }
      }
    }
    
    // Try to calculate order from source if projectedOrder is not available
    // Since source/target don't have group info, use activeNode's parent
    if (!finalProjectedOrder && activeNode && source) {
      const activeUuid = String((activeNode as FilterInterface).uuid);
      const sourceIndex = typeof source.index === 'function' ? source.index() : source.index;
      const activeParentGroup = activeNode.parent ? containerIdForTreeParent(activeNode.parent) : undefined;
      
      if (activeParentGroup && typeof sourceIndex === 'number') {
        const group = getGroupNodeByContainerId(activeParentGroup);
        if (group) {
          const currentIndex = group.children.findIndex(c => (c as FilterInterface).uuid === activeUuid);
          
          // If the index changed, we need to reorder
          if (currentIndex !== sourceIndex) {
            const currentOrder = group.children.map(c => (c as FilterInterface).uuid);
            const withoutActive = currentOrder.filter(id => id !== activeUuid);
            const clampedIndex = Math.max(0, Math.min(sourceIndex, withoutActive.length));
            withoutActive.splice(clampedIndex, 0, activeUuid);
            finalProjectedOrder = { [activeParentGroup]: withoutActive };
          }
        }
      }
    }
    
    // If we still don't have projectedOrder, assume the drag was cancelled
    if (!finalProjectedOrder && activeNode) {
      // Force reactivity update to ensure UI is in sync
      if (activeNode.parent) {
        const parent = activeNode.parent as FilterGroupInterface;
        parent.children = [...parent.children];
      }
    }
    
    // Apply the reordering to the actual tree structure
    if (finalProjectedOrder && activeNode) {
      const activeUuid = String((activeNode as FilterInterface).uuid);
      
      // First, remove activeNode from its old parent if it's moving to a different container
      const oldParent = activeNode.parent as FilterGroupInterface | null;
      let removedFromOldParent = false;
      
      // Process each container that has a new order
      for (const [containerId, orderedIds] of Object.entries(finalProjectedOrder)) {
        const group = getGroupNodeByContainerId(containerId);
        if (!group) continue;
        
        // Create a map of UUID to node for quick lookup (includes current group's children)
        const nodeMap = new Map(
          group.children.map(child => [(child as FilterInterface).uuid, child as TreeNode<FilterInterface>])
        );
        
        // If activeNode is being moved TO this container but isn't in it yet, add to map
        if (orderedIds.includes(activeUuid) && !nodeMap.has(activeUuid)) {
          nodeMap.set(activeUuid, activeNode as TreeNode<FilterInterface>);
          
          // Remove from old parent if not already done
          if (!removedFromOldParent && oldParent && oldParent !== group) {
            const oldIndex = oldParent.children.findIndex(
              child => (child as FilterInterface).uuid === activeUuid
            );
            if (oldIndex !== -1) {
              oldParent.children.splice(oldIndex, 1);
              // Trigger reactivity on old parent
              oldParent.children = [...oldParent.children];
            }
            removedFromOldParent = true;
          }
          
          // Update parent reference
          activeNode.parent = group;
        }
        
        // Reorder children according to projectedOrder
        const reorderedChildren: FilterInterface[] = [];
        for (const uuid of orderedIds) {
          const node = nodeMap.get(uuid);
          if (node) {
            reorderedChildren.push(node as FilterInterface);
          }
        }
        
        // Set parent references before assignment
        reorderedChildren.forEach(child => {
          child.parent = group;
        });
        
        // Assign new array - this triggers reactivity
        group.children = reorderedChildren;
      }
    }
    
    // Clear preview state
    activeNode = null;
    activeId = null;
    operatorPreview = null;
    projectedOrder = null;
    lastValidProjectedOrder = null;
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
    const overContainerId = isEmptyDropZone
      ? over.data?.targetGroupId ? String(over.data.targetGroupId) : overId.replace('empty-', '')
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
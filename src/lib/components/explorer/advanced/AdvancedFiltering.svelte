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
  import { Tree } from '$lib/models/Tree.svelte';
  import { createFilterGroup } from '$lib/models/Filter.svelte';
  import { Operator } from '$lib/models/query/Query';

  let activeNode: FilterInterface | null = $state(null);
  let activeId: string | null = $state(null);
  let operatorPreview: { parentId: string | undefined; index: number } | null = $state(null);
  let projectedOrder: Record<string, string[]> | null = $state(null);

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
  localTree.root = Tree.deserialize<FilterInterface>($filterTree.serialized, (nodes, op) =>
    createFilterGroup(nodes as FilterInterface[], op),
  ).root;

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
    console.log('handleDragStart', event);
    const active = event.operation.source;
    if (!active) return;
    const id = String(active.id);
    const node = localTree.find((n) => (n as FilterInterface).uuid === id);
    activeId = id;
    if (node) activeNode = node as FilterInterface;
  }

  function handleDragEnd(event: any) {
    activeNode = null;
    activeId = null;
    operatorPreview = null;
    projectedOrder = null;
  }

  function handleDragOver(event: any) {
    console.log('handleDragOver', event);
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

    const activeContainerId = active.group
      ? String(active.group)
      : containerIdForTreeParent(activeNode?.parent);
    const overContainerId = over.group
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
  <DragDropProvider
    {sensors}
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
      {operatorPreview}
      {projectedOrder}
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
        <AdvancedItem
          filter={activeNode as FilterInterface}
          operator={localTree.root.operator}
          isOverlay={true}
          onRemove={removeNode}
        />
      {/if}
    </DragOverlay>
  </DragDropProvider>
</div>
<button class="btn preset-filled-primary-500" onclick={applyChanges}>Apply Changes</button>

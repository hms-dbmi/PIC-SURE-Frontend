// The filter-tree editor's drag-and-drop rules, kept free of the DOM and of dnd-kit: FilterTreeEditor
// turns dnd-kit's events into ids and drop-zone data, and these functions read and rearrange the
// editor's working copy of the tree.
import {
  isFilterGroup,
  type FilterGroupInterface,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import type { LogicTree } from '#lib/query/logicTree.svelte.ts';

type FilterTree = LogicTree<FilterInterface>;

// Sortable container id → the uuids of its children, in order. A group's container id is its
// uuid, except the root group's, which is ROOT_ID.
export type OrderMap = Record<string, string[]>;

export const ROOT_ID = 'root';
// EmptyDropZone ids are `empty-<groupId>`; GroupDropZone ids are `drop-<groupId>`, plus
// `__<insertAt>` for the slots between root-level groups.
const EMPTY_ZONE = 'empty-';
const GROUP_ZONE = 'drop-';

export interface DropZoneData {
  targetGroupId?: string;
  insertAt?: number;
}

export type DropOperation =
  | { type: 'canceled' }
  | { type: 'no-movement' }
  | { type: 'empty-drop-zone'; targetId: string }
  | { type: 'group-drop-zone'; targetId: string; targetData?: DropZoneData }
  | { type: 'cross-group'; targetId: string }
  | { type: 'reorder-applied' }
  | { type: 'fallback'; targetId: string | null };

export interface DropEvent {
  sourceId: string | null;
  targetId: string | null;
  targetData?: DropZoneData;
  canceled: boolean;
  // Whether a drag-over moved the source; false for a click on the handle.
  moved: boolean;
  // Whether a drag-over already applied a projected order to the tree.
  reordered: boolean;
}

export type DragOverResult =
  | { type: 'clear' } // forget the projected order
  | { type: 'keep' } // leave the projected order as it is
  | { type: 'project'; order: OrderMap };

export function groupByContainerId(
  tree: FilterTree,
  containerId: string | null | undefined,
): FilterGroupInterface | null {
  if (!containerId) return null;
  if (containerId === ROOT_ID) return tree.root as FilterGroupInterface;
  const node = tree.find((n) => n.uuid === containerId);
  return node && isFilterGroup(node) ? node : null;
}

export function containerIdOf(
  tree: FilterTree,
  group: FilterInterface['parent'],
): string | undefined {
  if (!group) return undefined;
  return group === tree.root ? ROOT_ID : String((group as FilterGroupInterface).uuid);
}

export function sortableOrder(tree: FilterTree): OrderMap {
  const order: OrderMap = {};
  const walk = (group: FilterGroupInterface, containerId: string) => {
    order[containerId] = group.children.map((child) => child.uuid);
    group.children.forEach((child) => {
      if (isFilterGroup(child)) walk(child, child.uuid);
    });
  };
  walk(tree.root as FilterGroupInterface, ROOT_ID);
  return order;
}

function isDropZoneId(id: string): boolean {
  return id.startsWith(EMPTY_ZONE) || id.startsWith(GROUP_ZONE);
}

function isOwnDropZone(targetId: string, sourceId: string): boolean {
  return targetId === `${GROUP_ZONE}${sourceId}` || targetId === `${EMPTY_ZONE}${sourceId}`;
}

function dropZoneGroupId(targetId: string, data?: DropZoneData): string | null {
  if (data?.targetGroupId) return String(data.targetGroupId);
  if (targetId.startsWith(EMPTY_ZONE)) return targetId.slice(EMPTY_ZONE.length);
  if (targetId.startsWith(GROUP_ZONE)) return targetId.slice(GROUP_ZONE.length);
  return null;
}

function wouldNestInItself(tree: FilterTree, node: FilterInterface, group: FilterGroupInterface) {
  return group === node || tree.isDescendant(group, node);
}

// Drops `node` at the end of the (empty) group behind an EmptyDropZone.
export function dropIntoEmptyGroup(
  tree: FilterTree,
  node: FilterInterface,
  targetId: string,
): boolean {
  if (!targetId.startsWith(EMPTY_ZONE)) return false;
  const group = groupByContainerId(tree, targetId.slice(EMPTY_ZONE.length));
  if (!group || wouldNestInItself(tree, node, group)) return false;
  tree.moveNode(node, group);
  return true;
}

// Drops `node` into the group behind a GroupDropZone: at the zone's `insertAt` slot (counted
// before the move), or at the end.
export function dropIntoGroupZone(
  tree: FilterTree,
  node: FilterInterface,
  targetId: string,
  data?: DropZoneData,
): boolean {
  if (!targetId.startsWith(GROUP_ZONE)) return false;
  const group = groupByContainerId(tree, dropZoneGroupId(targetId, data));
  if (!group || wouldNestInItself(tree, node, group)) return false;

  const from = node.parent;
  let index: number | undefined;
  if (data?.insertAt !== undefined && from) {
    index = data.insertAt;
    const current = from.children.findIndex((child) => child.uuid === node.uuid);
    if (from === group && current !== -1 && current < index) index -= 1;
  }
  tree.moveNode(node, group, index);
  return true;
}

// Drops `node` right after the node `targetId`, in that node's group: a move into another group,
// or a reorder within its own. Returns false when nothing moves.
export function dropBeside(tree: FilterTree, node: FilterInterface, targetId: string): boolean {
  // Dropped on itself: a click without a drag.
  if (targetId === node.uuid) return false;

  const target = tree.find((n) => n.uuid === targetId);
  const group = target?.parent as FilterGroupInterface | undefined;
  const from = node.parent;
  if (!group || !from || wouldNestInItself(tree, node, group)) return false;

  const targetIndex = group.children.findIndex((child) => child.uuid === targetId);
  const insertIndex = targetIndex !== -1 ? targetIndex + 1 : group.children.length;

  if (group !== from) {
    tree.moveNode(node, group, insertIndex);
    return true;
  }

  const current = group.children.findIndex((child) => child.uuid === node.uuid);
  if (current === -1 || current === insertIndex || current === insertIndex - 1) return false;
  tree.moveNode(node, group, current < insertIndex ? insertIndex - 1 : insertIndex);
  return true;
}

// The order that puts `node` at `index` in its own group, or null if it is already there.
export function orderAtIndex(
  tree: FilterTree,
  node: FilterInterface,
  index: number | undefined,
): OrderMap | null {
  const containerId = containerIdOf(tree, node.parent);
  if (!containerId || index === undefined) return null;
  const group = groupByContainerId(tree, containerId);
  if (!group) return null;

  const current = group.children.findIndex((child) => child.uuid === node.uuid);
  if (current === index) return null;

  const ids = group.children.map((child) => child.uuid).filter((id) => id !== node.uuid);
  ids.splice(Math.max(0, Math.min(index, ids.length)), 0, node.uuid);
  return { [containerId]: ids };
}

// Rearranges the containers named in `order` to match it, moving `node` there from its old group
// if the order puts it somewhere new. Ids the containers don't hold are skipped.
export function applyOrder(tree: FilterTree, node: FilterInterface, order: OrderMap) {
  const from = node.parent;
  let detached = false;

  for (const [containerId, ids] of Object.entries(order)) {
    const group = groupByContainerId(tree, containerId);
    if (!group) continue;

    const byId = new Map(group.children.map((child) => [child.uuid, child]));
    if (ids.includes(node.uuid) && !byId.has(node.uuid)) {
      byId.set(node.uuid, node);
      if (!detached && from && from !== group) {
        from.children = from.children.filter((child) => child.uuid !== node.uuid);
        detached = true;
      }
      node.parent = group;
    }

    group.children = ids
      .map((id) => byId.get(id))
      .filter((child): child is FilterInterface => child !== undefined)
      .map((child) => {
        child.parent = group;
        return child;
      });
  }
}

export function nestsGroupInItself(order: OrderMap, node: FilterInterface): boolean {
  if (!isFilterGroup(node)) return false;
  const uuid = node.uuid;

  for (const [containerId, ids] of Object.entries(order)) {
    if (!ids.includes(uuid) || containerId === ROOT_ID) continue;
    if (containerId === uuid) return true;

    const holds = (groupId: string): boolean =>
      (order[groupId] ?? []).some(
        (childId) => childId === containerId || (!!order[childId] && holds(childId)),
      );
    if (holds(uuid)) return true;
  }
  return false;
}

// Runs on the tree as the drag left it, before the snapshot is restored: a cross-group drop is
// told apart by the parents there.
export function classifyDrop(
  tree: FilterTree,
  node: FilterInterface | null,
  event: DropEvent,
): DropOperation {
  const { sourceId, targetData, canceled, moved, reordered } = event;
  let targetId = event.targetId;
  // A drop on the node itself or its own zones names no target. A keyboard drag of a group ends on
  // the group's own sortable, after a drag-over moved it through a "Move here" zone.
  if (targetId && sourceId && (targetId === sourceId || isOwnDropZone(targetId, sourceId))) {
    targetId = null;
  }

  if (canceled) return { type: 'canceled' };

  // A click on the handle lands on the node's own container.
  const parentId = containerIdOf(tree, node?.parent);
  if ((targetId === parentId || targetId === ROOT_ID) && !moved) return { type: 'no-movement' };

  if (targetId?.startsWith(EMPTY_ZONE)) return { type: 'empty-drop-zone', targetId };
  if (targetId?.startsWith(GROUP_ZONE)) return { type: 'group-drop-zone', targetId, targetData };

  if (targetId && node) {
    const target = tree.find((n) => n.uuid === targetId);
    if (target) {
      const crossGroup = target.parent && node.parent && target.parent !== node.parent;
      if (crossGroup || isFilterGroup(target)) return { type: 'cross-group', targetId };
    }
  }

  if (reordered) return { type: 'reorder-applied' };
  return { type: 'fallback', targetId };
}

// Carries out a classified drop on a tree that is back in its pre-drag state. `projected` and
// `lastProjected` are the drag-over's current and last projected orders; `sourceIndex` is
// dnd-kit's final index for the source.
export function applyDrop(
  tree: FilterTree,
  node: FilterInterface,
  op: DropOperation,
  drag: { projected: OrderMap | null; lastProjected: OrderMap | null; sourceIndex?: number },
) {
  switch (op.type) {
    case 'canceled':
    case 'no-movement':
      return;
    case 'empty-drop-zone':
      dropIntoEmptyGroup(tree, node, op.targetId);
      return;
    case 'group-drop-zone':
      dropIntoGroupZone(tree, node, op.targetId, op.targetData);
      return;
    case 'cross-group':
      dropBeside(tree, node, op.targetId);
      return;
    case 'reorder-applied':
      if (drag.lastProjected) applyOrder(tree, node, drag.lastProjected);
      return;
    case 'fallback': {
      let order = drag.projected ?? drag.lastProjected;
      if (!order && op.targetId && dropBeside(tree, node, op.targetId)) return;
      order ??= orderAtIndex(tree, node, drag.sourceIndex);
      if (order) applyOrder(tree, node, order);
    }
  }
}

// What a drag-over does to the projected order. `move` is dnd-kit's sortable move for the event.
export function projectDragOver(
  tree: FilterTree,
  node: FilterInterface | null,
  over: { sourceId: string | null; targetId: string | null; targetData?: DropZoneData },
  move: (order: OrderMap) => OrderMap,
): DragOverResult {
  const { sourceId, targetId, targetData } = over;
  if (!sourceId || !targetId) return { type: 'clear' };

  const isDropZone = isDropZoneId(targetId);
  if (isDropZone && isOwnDropZone(targetId, sourceId)) return { type: 'clear' };

  const baseOrder = sortableOrder(tree);
  let nextOrder: OrderMap;

  if (isDropZone) {
    const groupId = dropZoneGroupId(targetId, targetData);
    if (!groupId) return { type: 'keep' };

    nextOrder = {};
    for (const [containerId, ids] of Object.entries(baseOrder)) {
      nextOrder[containerId] = ids.filter((id) => id !== sourceId);
    }
    nextOrder[groupId] ??= [];
    const insertAt = targetData?.insertAt;
    if (insertAt !== undefined) {
      // insertAt counts the source if it was in this group before it.
      const originalIndex = (baseOrder[groupId] ?? []).indexOf(sourceId);
      let index = originalIndex !== -1 && originalIndex < insertAt ? insertAt - 1 : insertAt;
      index = Math.min(index, nextOrder[groupId].length);
      nextOrder[groupId].splice(index, 0, sourceId);
    } else {
      nextOrder[groupId].push(sourceId);
    }
  } else {
    nextOrder = move(baseOrder);
  }

  if (nextOrder === baseOrder) return { type: 'keep' };
  if (node && nestsGroupInItself(nextOrder, node)) return { type: 'clear' };

  // A group changes containers only through a drop zone, on drop.
  if (node && isFilterGroup(node)) {
    const containerOf = (order: OrderMap) =>
      Object.keys(order).find((containerId) => order[containerId].includes(sourceId)) ?? null;
    if (containerOf(baseOrder) !== containerOf(nextOrder)) return { type: 'clear' };
  }

  const sourceMoved = Object.entries(nextOrder).some(([containerId, ids]) => {
    const nextIndex = ids.indexOf(sourceId);
    return nextIndex !== -1 && nextIndex !== (baseOrder[containerId] ?? []).indexOf(sourceId);
  });
  return sourceMoved ? { type: 'project', order: nextOrder } : { type: 'keep' };
}

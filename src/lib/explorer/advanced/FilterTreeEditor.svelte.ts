import { createContext } from 'svelte';
import {
  type FilterInterface,
  type FilterGroupInterface,
  isFilterGroup,
  createFilterGroup,
} from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { Operator, type OperatorType } from '#lib/query/query.ts';
import {
  move,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '#lib/ui/sortable/sortable.ts';
import {
  applyDrop,
  applyOrder,
  classifyDrop,
  containerIdOf,
  projectDragOver,
  type DropZoneData,
  type OrderMap,
} from './filterTreeOps.ts';

/**
 * One Advanced Filtering editor: a working copy of the filter tree, the drag in progress and the
 * edits the groups and items make. Created by AdvancedFiltering and provided to the tree below it.
 */
export class FilterTreeEditor {
  readonly tree: LogicTree<FilterInterface>;

  activeNode: FilterInterface | null = $state(null);
  activeId: string | null = $state(null);
  readonly isGroupDrag = $derived(this.activeNode !== null && isFilterGroup(this.activeNode));

  #saved = $state('');
  // Not $state: nothing renders them, only the drag handlers read them.
  #projected: OrderMap | null = null;
  // The last projected order, kept for the drop after a drag-over cleared #projected.
  #lastProjected: OrderMap | null = null;
  #snapshot: string | null = null;
  #reordered = false;
  // A drag-over moved the source; false for a click on the handle.
  #moved = false;

  constructor(tree: LogicTree<FilterInterface>, saved = tree.serialized) {
    this.tree = tree;
    this.#saved = saved;
  }

  get root() {
    return this.tree.root as FilterGroupInterface;
  }

  get dirty() {
    return this.tree.serialized !== this.#saved;
  }

  /** The sortable id of a group: `root` for the tree's root, its uuid otherwise. */
  idOf(group: FilterGroupInterface) {
    return containerIdOf(this.tree, group)!;
  }

  /** The sortable group (container id) a node sits in. */
  containerOf(node: FilterInterface) {
    return containerIdOf(this.tree, node.parent);
  }

  addGroup = () => {
    this.tree.add(createFilterGroup([], Operator.AND));
  };

  remove = (node: FilterInterface) => {
    this.tree.remove(node);
  };

  setOperator = (group: FilterGroupInterface, operator: OperatorType) => {
    group.setOperator(operator);
  };

  /** Prunes the working tree, marks it saved and returns a copy to commit. */
  apply() {
    this.tree.pruneTree();
    this.#saved = this.tree.serialized;
    return this.tree.clone();
  }

  /**
   * Empties the working tree and marks it saved, so it holds back no navigation. Drops a drag in
   * progress too: its end would restore the tree it started from.
   */
  discard() {
    this.#clearDrag();
    this.tree.root.children = [];
    this.#saved = this.tree.serialized;
  }

  dragStart = (event: DragStartEvent) => {
    const active = event.operation.source;
    if (!active) return;
    const id = String(active.id);
    const node = this.tree.find((n) => n.uuid === id);
    this.activeId = id;
    if (node) this.activeNode = node;
    this.#snapshot = this.tree.serialized;
    this.#reordered = false;
    this.#moved = false;
  };

  dragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation;
    const result = projectDragOver(
      this.tree,
      this.activeNode,
      {
        sourceId: source ? String(source.id) : null,
        targetId: target ? String(target.id) : null,
        targetData: target?.data as DropZoneData | undefined,
      },
      (order) => move(order, event),
    );

    if (result.type === 'clear') {
      this.#projected = null;
    } else if (result.type === 'project') {
      this.#projected = result.order;
      this.#lastProjected = result.order;
      this.#reordered = true;
      this.#moved = true;
      if (this.activeNode) applyOrder(this.tree, this.activeNode, result.order);
    }
  };

  dragEnd = (event: DragEndEvent) => {
    const { source, target } = event.operation;
    const op = classifyDrop(this.tree, this.activeNode, {
      sourceId: source?.id ? String(source.id) : null,
      targetId: target?.id ? String(target.id) : null,
      targetData: target?.data as DropZoneData | undefined,
      canceled: event.canceled,
      moved: this.#moved,
      reordered: this.#reordered,
    });

    try {
      // Always restore to pre-drag state first, so every path
      // below mutates from a known-clean starting point.
      this.#restoreSnapshot();

      // The restore replaced every node, so find the dragged one again.
      const node = this.activeId ? this.tree.find((n) => n.uuid === this.activeId) : undefined;
      if (node) {
        // Sortable sources carry their final index; plain draggables don't.
        const index = (source as { index?: unknown } | null)?.index;
        applyDrop(this.tree, node, op, {
          projected: this.#projected,
          lastProjected: this.#lastProjected,
          sourceIndex: typeof index === 'number' ? index : undefined,
        });
      }
    } finally {
      this.#clearDrag();
    }
  };

  #restoreSnapshot() {
    if (!this.#snapshot) return;
    this.tree.root = LogicTree.deserialize<FilterInterface>(
      this.#snapshot,
      this.tree.createGroup,
    ).root;
  }

  #clearDrag() {
    this.activeNode = null;
    this.activeId = null;
    this.#projected = null;
    this.#lastProjected = null;
    this.#snapshot = null;
    this.#reordered = false;
    this.#moved = false;
  }
}

export const [getFilterTreeEditor, setFilterTreeEditor] = createContext<FilterTreeEditor>();

// Set by the drag overlay's copy of the dragged node, so that copy stays visible and inert.
const [, setInDragOverlay, hasInDragOverlay] = createContext<true>();

export function markDragOverlay() {
  setInDragOverlay(true);
}

export function isInDragOverlay() {
  return hasInDragOverlay();
}

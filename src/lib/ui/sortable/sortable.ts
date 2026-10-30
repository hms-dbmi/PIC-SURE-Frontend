import {
  createSortable as createDndSortable,
  type CreateSortableInput,
} from '@dnd-kit/svelte/sortable';
import { OptimisticSortingPlugin, SortableKeyboardPlugin } from '@dnd-kit/dom/sortable';
import type { Data } from '@dnd-kit/abstract';

export { createDroppable, DragOverlay } from '@dnd-kit/svelte';
export { CollisionPriority } from '@dnd-kit/abstract';
export { move } from '@dnd-kit/helpers';
export type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/dom';

/**
 * A sortable item or drop target, for use inside a SortableProvider. @dnd-kit/svelte leaves out
 * dnd-kit's optimistic sorting, but the banner queue and the filter tree were built on it (the
 * adapter they used before kept it): without it, keyboard moves and moves between subqueries
 * stop. Must be called during component initialisation.
 */
export function createSortable<T extends Data = Data>(input: CreateSortableInput<T>) {
  // Inherit from `input` rather than spread it, so its getters stay live. The adapter copies only
  // own properties when it builds the Sortable, so id, index and the rest arrive a moment later
  // from its effects, which dnd-kit handles by registering the sortable again under its id.
  return createDndSortable<T>(
    Object.create(input, {
      plugins: { value: input.plugins ?? [SortableKeyboardPlugin, OptimisticSortingPlugin] },
    }),
  );
}

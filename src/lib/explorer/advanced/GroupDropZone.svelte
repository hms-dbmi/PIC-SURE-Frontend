<script lang="ts">
  import { CollisionPriority, createDroppable } from '#lib/ui/sortable/sortable.ts';
  import { getFilterTreeEditor, isInDragOverlay } from './FilterTreeEditor.svelte.ts';

  interface Props {
    groupId: string;
    label?: string;
    insertAt?: number;
  }

  let { groupId, label = 'Drop into subquery', insertAt }: Props = $props();

  const editor = getFilterTreeEditor();
  const isOverlay = isInDragOverlay();

  // When enabled, High priority ensures it wins over group sortables
  // filterTreeOps refuses drops of a group into itself
  // Disable in overlay mode to prevent duplicate sortable IDs
  const zone = createDroppable({
    get id() {
      return insertAt !== undefined ? `drop-${groupId}__${insertAt}` : `drop-${groupId}`;
    },
    type: 'drop',
    accept: ['group'],
    collisionPriority: CollisionPriority.High,
    get disabled() {
      return isOverlay;
    },
    get data() {
      return { targetGroupId: groupId, isGroupDropZone: true, insertAt };
    },
  });

  // Only show the zone visually when dragging a group
  const showZone = $derived(!isOverlay && editor.isGroupDrag);
</script>

<div
  data-testid="filter-group-drop-zone"
  data-group-id={groupId}
  class="rounded-md mt-1 mb-1 border border-dashed text-primary-600 text-xs font-semibold uppercase tracking-wide flex items-center justify-center transition-all"
  class:h-0={!showZone}
  class:opacity-0={!showZone}
  class:border-transparent={!showZone}
  class:h-24={showZone}
  class:opacity-100={showZone}
  class:bg-primary-50={showZone}
  class:border-primary-500={showZone}
  class:py-2={showZone}
  {@attach zone.attach}
>
  <span class="sr-only">{label}</span>
  {#if showZone}
    <span>{label}</span>
  {/if}
</div>

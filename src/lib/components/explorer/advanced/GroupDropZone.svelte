<script lang="ts">
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import { CollisionPriority } from '@dnd-kit/abstract';

  interface Props {
    groupId: string;
    index?: number;
    label?: string;
    isActive?: boolean;
    isGroupDrag?: boolean;
    isOverlay?: boolean;
    activeId?: string | null;
  }

  let {
    groupId,
    index = 0,
    label = 'Drop into group',
    isActive = false,
    isGroupDrag = false,
    isOverlay = false,
    activeId = null,
  }: Props = $props();

  // Disable if this dropzone belongs to the currently dragged group
  const isOwnDropzone = $derived(activeId === groupId);

  // When enabled, High priority ensures it wins over group sortables
  // Disable for the currently dragged group (can't drop into itself)
  const { ref, isDropTarget } = useSortable({
    id: `drop-${groupId}`,
    index: () => index,
    type: 'drop',
    accept: ['group'],
    collisionPriority: CollisionPriority.High,
    disabled: () => isOwnDropzone,
    data: { targetGroupId: groupId, isGroupDropZone: true },
  });

  // Only show the zone visually when dragging a group
  const showZone = $derived(!isOverlay && isGroupDrag);
</script>

<div
  data-testid="group-drop-zone"
  data-group-id={groupId}
  class="rounded-md border border-dashed text-primary-600 text-xs font-semibold uppercase tracking-wide flex items-center justify-center transition-all"
  class:h-2={!showZone}
  class:opacity-0={!showZone}
  class:border-transparent={!showZone}
  class:h-24={showZone}
  class:opacity-100={showZone}
  class:bg-primary-50={showZone}
  class:border-primary-500={showZone}
  class:py-4={showZone}
  {@attach ref}
>
  <span class="sr-only">{label}</span>
  {#if showZone}
    <span>{label}</span>
  {/if}
</div>

<script lang="ts">
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import { CollisionPriority } from '@dnd-kit/abstract';

  interface Props {
    groupId: string;
    index?: number;
    label?: string;
    isGroupDrag?: boolean;
    isOverlay?: boolean;
    insertAt?: number;
  }

  let {
    groupId,
    index = 0,
    label = 'Drop into subquery',
    isGroupDrag = false,
    isOverlay = false,
    insertAt,
  }: Props = $props();

  // When enabled, High priority ensures it wins over group sortables
  // Self-drop protection is handled in handleGroupDropZone
  // Disable in overlay mode to prevent duplicate sortable IDs
  const { ref } = useSortable({
    get id() {
      return insertAt !== undefined ? `drop-${groupId}__${insertAt}` : `drop-${groupId}`;
    },
    index: () => index,
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
  const showZone = $derived(!isOverlay && isGroupDrag);
</script>

<div
  data-testid="group-drop-zone"
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
  {@attach ref}
>
  <span class="sr-only">{label}</span>
  {#if showZone}
    <span>{label}</span>
  {/if}
</div>

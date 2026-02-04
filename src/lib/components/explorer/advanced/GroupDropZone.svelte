<script lang="ts">
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import { CollisionPriority } from '@dnd-kit/abstract';

  interface Props {
    groupId: string;
    index?: number;
    label?: string;
    isActive?: boolean;
    isOverlay?: boolean;
  }

  let {
    groupId,
    index = 0,
    label = 'Drop into group',
    isActive = false,
    isOverlay = false,
  }: Props = $props();

  const { ref, isDropTarget } = useSortable({
    id: `drop-${groupId}`,
    index: () => index,
    type: 'drop',
    accept: ['item', 'group'],
    collisionPriority: CollisionPriority.High,
    data: { targetGroupId: groupId, isGroupDropZone: true },
  });

  const showZone = $derived(!isOverlay && (isActive || isDropTarget.current));
</script>

<div
  data-testid="group-drop-zone"
  data-group-id={groupId}
  class="rounded-md border border-dashed border-primary-500 bg-primary-50 text-primary-600 text-xs font-semibold uppercase tracking-wide flex items-center justify-center transition-all overflow-hidden"
  class:max-h-0={!showZone}
  class:opacity-0={!showZone}
  class:py-0={!showZone}
  class:max-h-16={showZone}
  class:opacity-100={showZone}
  class:py-2={showZone}
  {@attach ref}
>
  <span class="sr-only">{label}</span>
  {#if showZone}
    <span>{label}</span>
  {/if}
</div>

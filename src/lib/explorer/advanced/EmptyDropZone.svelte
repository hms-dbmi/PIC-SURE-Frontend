<script lang="ts">
  import { CollisionPriority, createDroppable } from '#lib/ui/sortable/sortable.ts';
  import { cardClass } from '#lib/ui/surface.ts';

  interface Props {
    groupId: string;
  }

  let { groupId }: Props = $props();

  // No group parameter - accepts drops from any group
  // Highest priority ensures this wins over parent containers
  const zone = createDroppable({
    get id() {
      return `empty-${groupId}`;
    },
    type: 'item',
    accept: ['item', 'group'],
    collisionPriority: CollisionPriority.Highest,
    get data() {
      return { targetGroupId: groupId, isEmptyDropZone: true };
    },
  });
</script>

<div
  class="{cardClass} bg-surface-50 text-center text-surface-400 italic py-4 transition-colors"
  class:bg-primary-100={zone.isDropTarget}
  class:text-primary-600={zone.isDropTarget}
  {@attach zone.attach}
>
  {zone.isDropTarget ? 'Drop here' : 'Drop items here'}
</div>

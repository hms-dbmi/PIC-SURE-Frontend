<script lang="ts">
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import { CollisionPriority } from '@dnd-kit/abstract';

  interface Props {
    groupId: string;
  }

  let { groupId }: Props = $props();

  const { ref, isDropTarget } = useSortable({
    id: `empty-${groupId}`,
    index: () => 0,
    type: 'item',
    accept: ['item', 'group'],
    collisionPriority: CollisionPriority.High,
    group: groupId,
    data: { targetGroupId: groupId },
  });
</script>

<div 
  class="card bg-surface-50 border-surface-400 border text-center text-surface-400 italic py-4 transition-colors"
  class:bg-primary-100={isDropTarget.current}
  class:border-primary-500={isDropTarget.current}
  class:text-primary-600={isDropTarget.current}
  {@attach ref}
>
  {isDropTarget.current ? 'Drop here' : 'Drop items here'}
</div>

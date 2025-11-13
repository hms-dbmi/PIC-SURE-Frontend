<script lang="ts">
  import { useDroppable, type UseDroppableArguments } from '@dnd-kit-svelte/core';
  import type { ClassValue } from 'clsx';
  import type { Snippet } from 'svelte';

  interface DroppableProps extends UseDroppableArguments {
    children: Snippet;
    class?: ClassValue;
    id?: string;
  }

  let { children, class: className, id }: DroppableProps = $props();

  const droppable = useDroppable({ id: id ?? '' });
</script>

<div id={`droppable-${id}`} class={[className]} bind:this={droppable.node.current}>
  {@render children()}
</div>

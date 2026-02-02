<script lang="ts">
  import type { FilterInterface, FilterGroupInterface } from '$lib/models/Filter.svelte';
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import type { OperatorType } from '$lib/models/query/Query';
  import { CollisionPriority } from '@dnd-kit/abstract';

  interface Props {
    filter: FilterInterface;
    index?: number;
    parentId?: string;
    isOverlay?: boolean;
    activeId?: string | null;
    onRemove: (filter: FilterInterface) => void;
  }

  let {
    filter,
    index = 0,
    parentId,
    isOverlay = false,
    activeId = null,
    onRemove,
  }: Props = $props();
  
  // Derive the actual index from parent's children array (reactive to array changes)
  const actualIndex = $derived(
    filter.parent 
      ? (filter.parent as FilterGroupInterface).children.findIndex(
          child => (child as FilterInterface).uuid === filter.uuid
        )
      : -1
  );
  
  // Derive leadingOperator from parent's operator when actualIndex > 0
  const leadingOperator = $derived(
    actualIndex > 0 && filter.parent 
      ? (filter.parent as FilterGroupInterface).operator 
      : undefined
  );
  const showLeadingOperator = $derived(actualIndex > 0 && leadingOperator !== undefined);

  const {ref, handleRef, isDragging, isDropTarget} = useSortable({
		id: filter.uuid,
		index: () => index,
		type: 'item',
		accept: 'item',
		collisionPriority: CollisionPriority.High,
		group: parentId,
		data: filter as FilterInterface,
	});

</script>

<div class="relative flex flex-col gap-2" {@attach ref}>
  {#if showLeadingOperator && leadingOperator}
    <div class="flex justify-center py-1 {activeId && activeId === filter.uuid && !isOverlay ? 'invisible' : ''}">
      <span class="badge preset-filled-primary-200-800 font-bold text-xs uppercase">
        {leadingOperator}
      </span>
    </div>
  {/if}

  <div
    class="card flex flex-row gap-2 items-center p-4 {isDragging.current && !isOverlay ? 'invisible' : ''} bg-white border-surface-400 border"
  >
    <div class="cursor-grab active:cursor-grabbing m-0 flex items-center" {@attach handleRef}>
      <i class="fa-solid fa-grip-vertical text-surface-500"></i>
    </div>
    <div class="flex flex-col">
      <div class="text-sm font-medium">{filter.variableName}</div>
      {#if filter.searchResult?.studyAcronym}
        <div class="text-xs text-surface-500">Study: {filter.searchResult.studyAcronym}</div>
      {/if}
    </div>
    <div class="ml-auto">
      <button
        type="button"
        title="Remove Filter"
        class="bg-initial text-black-500 hover:text-primary-600"
        onclick={() => onRemove(filter as FilterInterface)}
      >
        <i class="fa-solid fa-times-circle"></i>
        <span class="sr-only">Remove Filter</span>
      </button>
    </div>
  </div>

  {#if !isOverlay && isDragging.current}
    <div
      data-testid="drop-preview"
      class="max-md:hidden absolute inset-0 bg-primary-500/10 border border-dashed border-primary-500 rounded-lg"
    ></div>
  {/if}
</div>

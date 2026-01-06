<script lang="ts">
  import type { FilterInterface } from '$lib/models/Filter.svelte';
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import type { OperatorType } from '$lib/models/query/Query';

  interface Props {
    filter: FilterInterface;
    index?: number;
    projectedOrder?: Record<string, string[]> | null;
    parentId?: string;
    isOverlay?: boolean;
    effectiveIndex?: number;
    activeId?: string | null;
    onRemove: (filter: FilterInterface) => void;
    operator: OperatorType;
  }

  let {
    filter,
    index = 0,
    parentId,
    isOverlay = false,
    effectiveIndex = 0,
    activeId = null,
    onRemove,
    projectedOrder = null,
    operator,
  }: Props = $props();

  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: filter.uuid,
    index: () => index,
    type: 'item',
    accept: 'item',
    group: parentId,
    data: filter as FilterInterface,
  });

  const parent = projectedOrder?.[parentId ?? ''] ?? [];
  const showTrailingOperator = $derived(!(effectiveIndex > 0) && (effectiveIndex === parent.length - 1));
</script>

<div class="flex flex-col gap-2" {@attach ref}>
  {#if effectiveIndex > 0}
    <div
      class="flex justify-center py-1 {activeId && activeId === filter.uuid && !isOverlay
        ? 'invisible'
        : ''}"
    >
      <span id={`leading-operator-${filter.uuid}`} class="badge preset-filled-primary-200-800 font-bold text-xs uppercase">
        {operator}
      </span>
    </div>
  {/if}

  <div
    id={`item-${filter.uuid}`}
    class="card flex flex-row gap-2 items-center p-4 bg-white border-surface-400 border {isDragging.current &&
    !isOverlay
      ? 'invisible'
      : ''}"
  >
    <div class="cursor-grab active:cursor-grabbing m-0 flex items-center" {@attach handleRef}>
      <i class="fa-solid fa-grip-vertical text-surface-500"></i>
    </div>
    <div class="text-sm font-medium">{filter.variableName}</div>
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
      class="max-md:hidden absolute inset-0 bg-primary-500/10 border border-dashed border-primary-500 rounded-lg"
    ></div>
  {/if}
  
  {#if showTrailingOperator}
    <div
      class="flex justify-center py-1 {activeId && activeId === filter.uuid && !isOverlay
        ? 'invisible'
        : ''}"
    >
      <span id={`leading-operator-${filter.uuid}`} class="badge preset-filled-primary-200-800 font-bold text-xs uppercase">
        {operator}
      </span>
    </div>
  {/if}
</div>

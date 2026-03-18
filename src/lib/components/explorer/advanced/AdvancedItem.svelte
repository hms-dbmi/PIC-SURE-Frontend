<script lang="ts">
  import type { FilterInterface } from '$lib/models/Filter.svelte';
  import { derivedFilterDescription } from '$lib/models/Filter.svelte';
  import type { Filter } from '$lib/models/Filter.svelte';
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import { CollisionPriority } from '@dnd-kit/abstract';
  import { slide } from 'svelte/transition';

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

  const anyRecordOfFilter = $derived(filter.filterType === 'AnyRecordOf');
  let open = $state(false);
  let caret = $state('fa-caret-up');

  // Derive the actual index from parent's children array (reactive to array changes)
  const actualIndex = $derived(
    filter.parent ? filter.parent.children.findIndex((child) => child.uuid === filter.uuid) : -1,
  );

  // Derive leadingOperator from parent's operator when actualIndex > 0
  const leadingOperator = $derived(
    actualIndex > 0 && filter.parent ? filter.parent.operator : undefined,
  );
  const showLeadingOperator = $derived(actualIndex > 0 && leadingOperator !== undefined);

  // Disable in overlay mode to prevent duplicate sortable IDs
  const { ref, handleRef } = useSortable({
    get id() {
      return filter.uuid;
    },
    index: () => index,
    type: 'item',
    accept: 'item',
    collisionPriority: CollisionPriority.High,
    get group() {
      return parentId;
    },
    get data() {
      return filter;
    },
    get disabled() {
      return isOverlay;
    },
  });

  const toggleCardBody = function (event: Event) {
    event.stopPropagation();
    event.preventDefault();
    open = !open;
    caret = open ? 'fa-caret-down' : 'fa-caret-up';
  };
</script>

<div class="relative" {@attach ref}>
  {#if showLeadingOperator && leadingOperator}
    <div
      class="flex justify-center py-1 {activeId && activeId === filter.uuid && !isOverlay
        ? 'invisible'
        : ''}"
    >
      <span
        class="badge font-bold text-xs uppercase {leadingOperator === 'OR'
          ? 'preset-filled-secondary-200-800'
          : 'preset-filled-primary-200-800'}"
      >
        {leadingOperator}
      </span>
    </div>
  {/if}

  <div
    class="card flex flex-col gap-2 py-2 px-4 {activeId === filter.uuid && !isOverlay
      ? 'invisible'
      : ''} bg-white border-surface-400 border"
  >
    <div class="flex flex-row items-center justify-start gap-2">
      <div class="cursor-grab active:cursor-grabbing m-0 flex items-center" {@attach handleRef}>
        <i class="fa-solid fa-grip-vertical text-surface-500"></i>
      </div>
      <div class="flex flex-col self-end">
        <div class="text-sm font-medium">{filter.variableName}</div>
        {#if filter.searchResult?.studyAcronym}
          <div class="text-xs text-surface-500">Study: {filter.searchResult.studyAcronym}</div>
        {:else if filter.searchResult?.dataset}
          <div class="text-xs text-surface-500">Study: {filter.searchResult.dataset}</div>
        {/if}
      </div>
      <div class="ml-auto">
        <button
          type="button"
          title="Remove Filter"
          class="bg-initial text-black-500 hover:text-primary-600"
          onclick={() => onRemove(filter)}
        >
          <i class="fa-solid fa-times-circle"></i>
          <span class="sr-only">Remove Filter</span>
        </button>
        {#if !anyRecordOfFilter}
          <button
            type="button"
            title="See details"
            class="bg-initial text-black-500 hover:text-primary-600"
            onclick={toggleCardBody}
          >
            <i class="fa-solid {caret}"></i>
            <span class="sr-only">See details</span>
          </button>
        {/if}
      </div>
    </div>
    {#if open}
      <section class="pb-2 px-4 whitespace-pre-wrap" transition:slide={{ axis: 'y' }}>
        {derivedFilterDescription(filter as Filter)}
      </section>
    {/if}
  </div>

  {#if !isOverlay && activeId === filter.uuid}
    <div
      data-testid="drop-preview"
      class="max-md:hidden absolute inset-0 bg-primary-500/10 border border-dashed border-primary-500 rounded-lg flex items-center justify-center"
    >
      <span class="text-primary-600 text-xs font-semibold uppercase tracking-wide">
        Moving: {filter.variableName}
      </span>
    </div>
  {/if}
</div>

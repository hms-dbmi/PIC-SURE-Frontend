<script lang="ts">
  import OperatorBadge from '#lib/ui/OperatorBadge.svelte';
  import { type Filter, type FilterInterface, describeFilter } from '#lib/query/filter.svelte.ts';
  import { CollisionPriority, createSortable } from '#lib/ui/sortable/sortable.ts';
  import SortableHandle from '#lib/ui/sortable/SortableHandle.svelte';
  import DropPreview from '#lib/ui/sortable/DropPreview.svelte';
  import { slide } from 'svelte/transition';
  import { cardClass } from '#lib/ui/surface.ts';
  import { getFilterTreeEditor, isInDragOverlay } from './FilterTreeEditor.svelte.ts';

  interface Props {
    filter: FilterInterface;
    index?: number;
  }

  let { filter, index = 0 }: Props = $props();

  const editor = getFilterTreeEditor();
  const isOverlay = isInDragOverlay();
  const parentId = $derived(editor.containerOf(filter));
  const activeId = $derived(editor.activeId);

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
  const dataset = $derived(
    filter.searchResult?.table?.display ?? filter.searchResult?.table?.dataset,
  );
  const searchResultMetadata = $derived(
    [
      filter.searchResult?.studyAcronym && `Study: ${filter.searchResult.studyAcronym}`,
      dataset && `Dataset: ${dataset}`,
    ]
      .filter(Boolean)
      .join(', '),
  );

  // Disable in overlay mode to prevent duplicate sortable IDs
  const sortable = createSortable({
    get id() {
      return filter.uuid;
    },
    get index() {
      return index;
    },
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

<div class="relative" {@attach sortable.attach}>
  {#if showLeadingOperator && leadingOperator}
    <div
      class="flex justify-center py-1 {activeId && activeId === filter.uuid && !isOverlay
        ? 'invisible'
        : ''}"
    >
      <OperatorBadge operator={leadingOperator} />
    </div>
  {/if}

  <div
    data-testid="filter-item"
    class="{cardClass} flex flex-col gap-2 py-1 px-2 {activeId === filter.uuid && !isOverlay
      ? 'invisible'
      : ''} bg-white"
  >
    <div class="flex flex-row items-center justify-start gap-2">
      <SortableHandle
        handle={sortable.attachHandle}
        class="flex items-center px-1"
        title="Click and drag to reorder and group filters"
      />
      <div class="flex flex-col self-end">
        <div data-testid="filter-name" class="text-sm font-medium">{filter.variableName}</div>
        {#if searchResultMetadata}
          <div class="text-xs text-surface-500">{searchResultMetadata}</div>
        {/if}
      </div>
      <div class="ml-auto">
        <button
          type="button"
          title="Remove Filter"
          class="hover:text-primary-600"
          onclick={() => editor.remove(filter)}
        >
          <i class="fa-solid fa-times-circle"></i>
          <span class="sr-only">Remove Filter</span>
        </button>
        {#if !anyRecordOfFilter}
          <button
            type="button"
            title="See details"
            class="hover:text-primary-600"
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
        {describeFilter(filter as Filter)}
      </section>
    {/if}
  </div>

  {#if !isOverlay && activeId === filter.uuid}
    <DropPreview
      data-testid="filter-drop-preview"
      class="max-md:hidden rounded-lg"
      label={filter.variableName}
    />
  {/if}
</div>

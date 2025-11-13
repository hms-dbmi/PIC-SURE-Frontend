<script lang="ts">
  import type { Filter, FilterGroupInterface } from '$lib/models/Filter';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import OperatorDropdown from '$lib/components/explorer/results/OperatorDropdown.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';
  import { SortableContext, useSortable } from '@dnd-kit-svelte/sortable';
  import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';

  type DropZone = 'top' | 'middle' | 'bottom' | null;
  let {
    group = $bindable(),
    hoverZone = null,
    hoverGroupId = null,
  }: {
    group: FilterGroupInterface;
    hoverZone?: DropZone;
    hoverGroupId?: string | null;
  } = $props();
  let id = $derived(group.uuid.split('-')[0]);
  const canReorder = $derived(group.children.length > 1 && (group.parent?.children?.length ? group.parent.children.length > 1 : false));
  const isRoot = $derived(group.parent === undefined || group.parent === null);
  const isHovered = $derived(hoverGroupId === group.uuid);
  const showMiddleZone = $derived(isHovered && hoverZone === 'middle' && !isRoot);
  const showTopZone = $derived(isHovered && hoverZone === 'top' && !isRoot);
  const showBottomZone = $derived(isHovered && hoverZone === 'bottom' && !isRoot);

  const {
    attributes,
    listeners,
    node,
    activatorNode,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: group.uuid,
    data: {
      type: group.parent === undefined || group.parent === null ? 'root' : 'group',
      accepts: ['item'],
    },
  });

  const style = $derived.by(() => {
    const current = transform.current;
    if (current) {
      current.scaleY = 1;
    }
    return styleObjectToString({
      transform: CSS.Transform.toString(current),
      transition: isSorting.current ? transition.current : undefined,
      zIndex: isDragging.current ? 1 : undefined,
    });
  });
</script>

{#key group.uuid}
  <div class="relative">
    {#if showTopZone}
      <div
        class="absolute -top-2 left-0 right-0 h-1 bg-primary-500 rounded-full z-10 shadow-lg"
      ></div>
      <div
        class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
      >
        Reorder before group
      </div>
    {/if}

    <div
      id={`filter-group-${id}`}
      data-testid={`filter-group-${id}`}
      data-sortable-id={group.uuid}
      bind:this={node.current}
      class={['flex flex-row items-center gap-0 transition-all']}
      {style}
    >
      {#if canReorder && !isRoot}
        <div
          class="flex items-center justify-center bg-surface-100 rounded-l-md p-1.5 w-7 flex-shrink-0 self-stretch min-h-full"
          bind:this={activatorNode.current}
          {...attributes.current}
          {...listeners.current}
        >
          <div class="cursor-grab active:cursor-grabbing text-primary-500">
            <i class="fa-solid fa-grip-vertical" style="color: var(--color-surface-900);"></i>
          </div>
        </div>
      {/if}
      <div
        class={`filter-group-${group.operator.toLowerCase()}`}
        data-testid={`filter-group-${id}`}
      >
        {#each group.children as child, index (child.uuid)}
          {#if index > 0}
            <OperatorDropdown
              siblingA={group.children[index - 1]}
              siblingB={group.children[index]}
              operator={group.operator}
            />
          {/if}
          {#if child && 'children' in child}
            <SortableContext items={(child as FilterGroupInterface).children.map((c) => c.uuid)}>
              <FilterGroup group={child as FilterGroupInterface} {hoverZone} {hoverGroupId} />
            </SortableContext>
          {:else}
            <FilterComponent
              filter={child as Filter}
              draggable={canReorder}
              {hoverZone}
              {hoverGroupId}
            />
          {/if}
        {/each}
      </div>
    </div>

    {#if showMiddleZone}
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-10 shadow-lg font-medium"
      >
        Add to group
      </div>
    {/if}

    {#if showBottomZone}
      <div
        class="absolute -bottom-2 left-0 right-0 h-1 bg-primary-500 rounded-full z-10 shadow-lg"
      ></div>
      <div
        class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
      >
        Reorder after group
      </div>
    {/if}

    {#if isDragging.current}
      <div class="absolute inset-0 flex flex-row items-center gap-0 pointer-events-none">
        {#if canReorder && !isRoot}
          <div
            class="flex items-center justify-center bg-surface-200/50 rounded-l-md p-1.5 w-7 flex-shrink-0 self-stretch min-h-full border-2 border-dashed border-surface-400"
          ></div>
        {/if}
        <div
          class="flex-1 h-full bg-surface-200/30 border-2 border-dashed border-surface-400 rounded-r-md flex items-center justify-center"
        >
          <div class="text-surface-500 text-sm opacity-50">
            Moving group: {group.operator.toLowerCase()}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/key}

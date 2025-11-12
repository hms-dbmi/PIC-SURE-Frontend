<script lang="ts">
  import type { Filter, FilterGroupInterface, FilterInterface } from '$lib/models/Filter';
  import FilterComponent from '$lib/components/explorer/results/AddedFilter.svelte';
  import OperatorDropdown from '$lib/components/explorer/results/OperatorDropdown.svelte';
  import FilterGroup from '$lib/components/explorer/results/FilterGroup.svelte';
  import { SortableContext, useSortable } from '@dnd-kit-svelte/sortable';
  import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';

  let { group = $bindable() }: { group: FilterGroupInterface } = $props();
  let id = $derived(group.uuid.split('-')[0]);
  const canReorder = $derived(group.children.length > 1);
  const isRoot = $derived(group.parent === undefined || group.parent === null);

  const {
    attributes,
    listeners,
    node,
    activatorNode,
    transform,
    transition,
    isDragging,
    isSorting,
    isOver,
  } = useSortable({
    id: group.uuid,
    data: { 
      type: group.parent === undefined || group.parent === null ? 'root' : 'group', 
      accepts: ['item'] 
    },
  });

  const style = $derived(
    styleObjectToString({
      transform: CSS.Transform.toString(transform.current),
      transition: isSorting.current ? transition.current : undefined,
      zIndex: isDragging.current ? 1 : undefined,
    }),
  );
</script>

{#key group.uuid}
  <div class="relative">
    <div
      id={`filter-group-${id}`}
      data-testid={`filter-group-${id}`}
      bind:this={node.current}
      class={[
        'flex flex-row items-center gap-0',
        { 
          invisible: isDragging.current, 
          'bg-primary-500/10 rounded-md ring-2 ring-primary-500': isOver.current && !isRoot
        },
      ]}
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
        class={`w-[250px] filter-group-${group.operator.toLowerCase()}`}
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
              <FilterGroup group={child as FilterGroupInterface} />
            </SortableContext>
          {:else}
            <FilterComponent filter={child as Filter} draggable={canReorder} />
          {/if}
        {/each}
      </div>
    </div>
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
          <div class="text-surface-500 text-sm opacity-50 ">
            Moving group: {group.operator.toLowerCase()}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/key}

<script lang="ts">
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
  import {
    isFilterGroup,
    type FilterGroupInterface,
    type FilterInterface,
  } from '$lib/models/Filter.svelte';
  import AdvancedItem from './AdvancedItem.svelte';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import EmptyDropZone from './EmptyDropZone.svelte';
  import GroupDropZone from './GroupDropZone.svelte';
  import { Operator, type OperatorType } from '$lib/models/query/Query';
  import { Segment } from '@skeletonlabs/skeleton-svelte';
  import { CollisionPriority } from '@dnd-kit/abstract';
  import { Switch } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    group: FilterGroupInterface;
    onRemove: (group: FilterGroupInterface) => void;
    onRemoveChild: (child: FilterInterface) => void;
    onOperatorChange?: (group: FilterGroupInterface, operator: OperatorType) => void;
    activeId?: string | null;
    isGroupDrag?: boolean;
    index?: number;
    isOverlay?: boolean;
    id?: string;
    parentId?: string;
  }

  let {
    group = $bindable(),
    activeId = null,
    isGroupDrag = false,
    index = 0,
    isOverlay = false,
    id = group.uuid,
    parentId,
    onRemove = () => {},
    onRemoveChild = () => {},
    onOperatorChange = (g, op) => {
      g.setOperator(op);
    },
  }: Props = $props();

  const operatorValue = $derived(group.operator || Operator.AND);
  let not = $state(false);
  const isDraggable = $derived(id !== 'root');

  // Derive the actual index from parent's children array (reactive to array changes)
  const actualIndex = $derived(
    group.parent ? group.parent.children.findIndex((child) => child.uuid === group.uuid) : -1,
  );

  // Derive leadingOperator from parent's operator when actualIndex > 0
  const leadingOperator = $derived(
    actualIndex > 0 && group.parent ? group.parent.operator : undefined,
  );
  const showLeadingOperator = $derived(actualIndex > 0 && leadingOperator !== undefined);

  // Disable in overlay mode to prevent duplicate sortable IDs
  const { ref, handleRef, isDragging } = useSortable({
    id: id,
    index: () => index,
    group: parentId,
    type: 'group',
    accept: ['item', 'group'],
    collisionPriority: CollisionPriority.Lowest,
    data: { ...group, targetGroupId: id },
    disabled: isOverlay,
  });
  const showDropPreview = $derived(!isOverlay && isDragging.current && isDraggable);

  function handleOperatorChange(e: any) {
    const newOperator = e.value as OperatorType;
    onOperatorChange(group, newOperator);
  }

  function handleNotChange(e: any) {
    not = e.checked;
  }
</script>

<div class="relative" {@attach ref}>
  {#if showLeadingOperator && leadingOperator}
    <div
      class="flex justify-center py-3 {activeId && activeId === id && !isOverlay
        ? 'invisible'
        : ''}"
    >
      <span class="badge preset-filled-primary-200-800 font-bold text-xs uppercase">
        {leadingOperator}
      </span>
    </div>
  {/if}

  <div
    class="card p-4 space-y-2 {id === 'root'
      ? 'bg-surface-50 shadow-none border-none'
      : activeId === id && isDragging.current && !isOverlay
        ? 'invisible'
        : 'bg-white border-surface-400 border'}"
  >
    {#if isDraggable}
      <div id={`group-controls-${group.uuid}`} class="flex flex-row w-full flex-end">
        <button
          type="button"
          title="Remove Group"
          class="bg-initial text-black-500 hover:text-primary-600"
          onclick={() => onRemove(group)}
        >
          <i class="fa-solid fa-times-circle"></i>
          <span class="sr-only">Remove Group</span>
        </button>
      </div>
    {/if}
    <div class="flex flex-row items-center gap-2 w-full">
      <div
        class="cursor-grab active:cursor-grabbing mr-2 {isDraggable ? 'block' : 'hidden'}"
        {@attach handleRef}
      >
        <i class="fa-solid fa-grip-vertical text-surface-500"></i>
      </div>
      <div class="flex items-center justify-start gap-2">
        <div>Between {id === 'root' ? 'groups' : 'items'}:</div>
        {#key operatorValue}
          <Segment
            background="bg-white border-surface-400 border"
            indicatorBg="bg-primary-500"
            name="operator"
            value={operatorValue}
            onValueChange={handleOperatorChange}
          >
            <Segment.Item value={Operator.AND}>{Operator.AND}</Segment.Item>
            <Segment.Item value={Operator.OR}>{Operator.OR}</Segment.Item>
          </Segment>
        {/key}
      </div>
      <div class="hidden flex items-center gap-2 ml-auto">
        <label for="not">Not:</label>
        <Switch name="not" checked={not} onCheckedChange={handleNotChange}>
          {#snippet activeChild()}!{/snippet}
        </Switch>
      </div>
    </div>

    <div class="flex flex-col gap-2 min-h-[50px] w-full">
      {#each group.children as child, i (child.uuid)}
        {#if isFilterGroup(child)}
          <AdvancedGroup
            group={child}
            index={i}
            parentId={id}
            {onRemove}
            {onRemoveChild}
            {isOverlay}
            {activeId}
            {isGroupDrag}
            {onOperatorChange}
          />
        {:else}
          <AdvancedItem
            filter={child}
            index={i}
            parentId={id}
            {isOverlay}
            {activeId}
            onRemove={onRemoveChild}
          />
        {/if}
      {/each}
      {#if group.children.length === 0}
        <EmptyDropZone groupId={id} />
      {:else if id !== 'root'}
        <!-- GroupDropZone for dropping groups into this group; only visible when dragging a group, not shown on root -->
        <GroupDropZone
          groupId={id}
          {isGroupDrag}
          isActive={activeId !== null}
          index={group.children.length}
          {isOverlay}
          {activeId}
        />
      {/if}
    </div>
  </div>

  {#if showDropPreview}
    <div
      data-testid="drop-preview"
      class="max-md:hidden absolute inset-0 bg-primary-500/10 border border-dashed border-primary-500 rounded-lg flex items-center justify-center"
    >
      <span class="text-primary-600 text-xs font-semibold uppercase tracking-wide">
        Moving: Group
      </span>
    </div>
  {/if}
</div>

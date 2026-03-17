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
    onAddGroup?: () => void;
    activeId?: string | null;
    isGroupDrag?: boolean;
    index?: number;
    isOverlay?: boolean;
    id?: string;
    parentId?: string;
  }

  let {
    group,
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
    onAddGroup = () => {},
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
  const { ref, handleRef } = useSortable({
    get id() {
      return id;
    },
    index: () => index,
    get group() {
      return parentId;
    },
    type: 'group',
    // Only accept items, not groups. Group-to-group collision causes dnd-kit's
    // sortable to try insertAdjacentElement which fails with HierarchyRequestError
    // when groups are containers. Group reordering uses GroupDropZone slots instead.
    accept: ['item'],
    collisionPriority: CollisionPriority.Lowest,
    get data() {
      return { ...group, targetGroupId: id };
    },
    get disabled() {
      return isOverlay;
    },
  });
  // Use our controlled activeId rather than dnd-kit's isDragging.current for the
  // drop preview. isDragging.current can get stuck when tree nodes are replaced
  // (e.g. restoreSnapshot in handleDragEnd), but activeId is always properly
  // cleared in clearDragState().
  const showDropPreview = $derived(!isOverlay && activeId === id && isDraggable);

  function handleOperatorChange(details: { value: string | null }) {
    if (details.value == null) return;
    onOperatorChange(group, details.value as OperatorType);
  }

  function handleNotChange(e: { checked: boolean }) {
    not = e.checked;
  }
</script>

<div class="relative" {@attach ref}>
  {#if showLeadingOperator && leadingOperator}
    <div class="flex justify-center py-2 {activeId === id && !isOverlay ? 'invisible' : ''}">
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
    class="card py-2 px-4 {id === 'root'
      ? 'bg-surface-50 shadow-none border-none'
      : activeId === id && !isOverlay
        ? 'invisible'
        : 'bg-white border-surface-400 border'}"
  >
    <div class="flex flex-row items-center gap-2 mb-1 w-full">
      <div
        class="cursor-grab active:cursor-grabbing mr-2 {isDraggable ? 'block' : 'hidden'}"
        {@attach handleRef}
      >
        <i class="fa-solid fa-grip-vertical text-surface-500"></i>
      </div>
      <div class="flex items-center justify-start gap-2 w-full">
        <div>Between {id === 'root' ? 'groups' : 'items'}:</div>
        <!-- {#key} forces re-mount because Skeleton's Segment doesn't update its indicator position on prop change -->
        {#key operatorValue}
          <Segment
            background="bg-white border-surface-400 border"
            indicatorBg={operatorValue === Operator.OR ? 'bg-secondary-500' : 'bg-primary-500'}
            name="operator"
            value={operatorValue}
            onValueChange={handleOperatorChange}
          >
            <Segment.Item value={Operator.AND}>{Operator.AND}</Segment.Item>
            <Segment.Item value={Operator.OR}>{Operator.OR}</Segment.Item>
          </Segment>
        {/key}
        {#if id === 'root'}
          <button class="btn preset-filled-primary-500 ml-auto" onclick={onAddGroup}
            >Add Group</button
          >
        {/if}
      </div>
      <!-- TODO: NOT operator support — hidden until backend supports negation -->
      <div class="hidden flex items-center gap-2 ml-auto">
        <label for="not">Not:</label>
        <Switch name="not" checked={not} onCheckedChange={handleNotChange}>
          {#snippet activeChild()}!{/snippet}
        </Switch>
      </div>
      {#if isDraggable}
        <div id={`group-controls-${group.uuid}`} class="ml-auto">
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
    </div>

    <div class="flex flex-col min-h-[50px] w-full">
      {#each group.children as child, i (child.uuid)}
        {#if id === 'root' && isGroupDrag && child.uuid !== activeId && (i === 0 || group.children[i - 1]?.uuid !== activeId)}
          <GroupDropZone groupId="root" {isGroupDrag} insertAt={i} {isOverlay} label="Move here" />
        {/if}
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
      {:else if id === 'root' && isGroupDrag && group.children[group.children.length - 1]?.uuid !== activeId}
        <!-- Reorder zone at end of root; skip if dragged group is already last -->
        <GroupDropZone
          groupId="root"
          {isGroupDrag}
          insertAt={group.children.length}
          {isOverlay}
          label="Move here"
        />
      {:else if id !== 'root' && !(isGroupDrag && group.children.some((c) => c.uuid === activeId))}
        <!-- GroupDropZone for dropping groups into this group; hidden when dragging a group that's already in this group -->
        <GroupDropZone groupId={id} {isGroupDrag} index={group.children.length} {isOverlay} />
      {/if}
    </div>
  </div>

  {#if showDropPreview}
    <div
      data-testid="drop-preview"
      id={`drop-preview-${id}`}
      class="max-md:hidden absolute inset-0 bg-primary-500/10 border border-dashed border-primary-500 rounded-lg flex items-center justify-center mt-1"
    >
      <span class="text-primary-600 text-xs font-semibold uppercase tracking-wide">
        Moving: Group
      </span>
    </div>
  {/if}
</div>

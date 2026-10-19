<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import OperatorBadge from '#lib/ui/OperatorBadge.svelte';
  import { css } from '#lib/ui/style.ts';
  import { CollisionPriority, createSortable } from '#lib/ui/sortable/sortable.ts';
  import SortableHandle from '#lib/ui/sortable/SortableHandle.svelte';
  import DropPreview from '#lib/ui/sortable/DropPreview.svelte';
  import { isFilterGroup, type FilterGroupInterface } from '#lib/query/filter.svelte.ts';
  import AdvancedItem from './AdvancedItem.svelte';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import EmptyDropZone from './EmptyDropZone.svelte';
  import GroupDropZone from './GroupDropZone.svelte';
  import { Operator, type OperatorType } from '#lib/query/query.ts';
  import { getFilterTreeEditor, isInDragOverlay } from './FilterTreeEditor.svelte.ts';
  import SegmentedControl from '#lib/ui/SegmentedControl.svelte';
  import Switch from '#lib/ui/Switch.svelte';
  import { cardClass } from '#lib/ui/surface.ts';

  interface Props {
    group: FilterGroupInterface;
    index?: number;
    depth?: number;
  }

  let { group, index = 0, depth = 0 }: Props = $props();

  const editor = getFilterTreeEditor();
  const isOverlay = isInDragOverlay();
  const id = $derived(editor.idOf(group));
  const parentId = $derived(editor.containerOf(group));
  const activeId = $derived(editor.activeId);
  const isGroupDrag = $derived(editor.isGroupDrag);

  const groupBg = $derived(`background-color: rgba(var(--depth-overlay), ${depth * 0.06})`);
  const groupBorder = $derived(`border-color: rgba(var(--depth-overlay), ${0.2 + depth * 0.08})`);

  const operatorValue = $derived(group.operator || Operator.AND);
  let not = $state(false);
  const hasSubqueryChildren = $derived(group.children.some((child) => isFilterGroup(child)));
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
  const sortable = createSortable({
    get id() {
      return id;
    },
    get index() {
      return index;
    },
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
  // Use the editor's activeId rather than dnd-kit's isDragging.current for the
  // drop preview. isDragging.current can get stuck when tree nodes are replaced
  // (the editor restores its snapshot on drop), but activeId is always cleared.
  const showDropPreview = $derived(!isOverlay && activeId === id && isDraggable);

  const operatorOptions = [
    { value: Operator.AND, label: Operator.AND },
    { value: Operator.OR, label: Operator.OR },
  ];
</script>

<div class="relative" {@attach sortable.attach}>
  {#if showLeadingOperator && leadingOperator}
    <div class="flex justify-center py-2 {activeId === id && !isOverlay ? 'invisible' : ''}">
      <OperatorBadge operator={leadingOperator} />
    </div>
  {/if}

  <div
    data-testid={id === 'root' ? 'filter-root' : 'filter-group'}
    class="{cardClass} py-1 px-2 {id === 'root'
      ? 'bg-surface-50 shadow-none border-none'
      : activeId === id && !isOverlay
        ? 'invisible'
        : 'border'}"
    {@attach css(
      id !== 'root' && !(activeId === id && !isOverlay) ? `${groupBg}; ${groupBorder}` : '',
    )}
  >
    <div class="flex flex-row items-center gap-2 mb-1 w-full">
      <SortableHandle
        handle={sortable.attachHandle}
        class="mr-2 px-1 {isDraggable ? 'block' : 'hidden'}"
        title="Click and drag to reorder and group filters"
      />
      <div class="flex items-center justify-start gap-2 w-full">
        <div>Between {hasSubqueryChildren ? 'subqueries' : 'filters'}:</div>
        <div title="Choose logic for the query">
          <SegmentedControl
            name="operator"
            value={operatorValue}
            options={operatorOptions}
            tone={operatorValue === Operator.OR ? 'secondary' : 'primary'}
            onchange={(value) => editor.setOperator(group, value as OperatorType)}
          />
        </div>
        {#if id === 'root'}
          <Button
            variant="soft"
            class="leading-(--text-lg--line-height) disabled:opacity-75 ml-auto mb-1"
            title="Add subquery to create a group of filters"
            onclick={editor.addGroup}
          >
            Add Subquery
          </Button>
        {/if}
      </div>
      <!-- TODO: NOT operator support — hidden until backend supports negation -->
      <div class="hidden flex items-center gap-2 ml-auto">
        <span>Not:</span>
        <Switch name="not" checked={not} onchange={(checked) => (not = checked)}>
          {#snippet checkedIcon()}!{/snippet}
        </Switch>
      </div>
      {#if isDraggable}
        <div id={`filter-group-controls-${group.uuid}`} class="ml-auto">
          <button
            type="button"
            title="Remove Subquery"
            class="hover:text-primary-600"
            onclick={() => editor.remove(group)}
          >
            <i class="fa-solid fa-times-circle"></i>
            <span class="sr-only">Remove Subquery</span>
          </button>
        </div>
      {/if}
    </div>

    <div class="flex flex-col min-h-[50px] w-full">
      {#each group.children as child, i (child.uuid)}
        {#if id === 'root' && isGroupDrag && child.uuid !== activeId && (i === 0 || group.children[i - 1]?.uuid !== activeId)}
          <GroupDropZone groupId="root" insertAt={i} label="Move here" />
        {/if}
        {#if isFilterGroup(child)}
          <AdvancedGroup group={child} index={i} depth={depth + 1} />
        {:else}
          <AdvancedItem filter={child} index={i} />
        {/if}
      {/each}
      {#if group.children.length === 0}
        <EmptyDropZone groupId={id} />
      {:else if id === 'root' && isGroupDrag && group.children[group.children.length - 1]?.uuid !== activeId}
        <!-- Reorder zone at end of root; skip if dragged group is already last -->
        <GroupDropZone groupId="root" insertAt={group.children.length} label="Move here" />
      {:else if id !== 'root' && !(isGroupDrag && group.children.some((c) => c.uuid === activeId))}
        <!-- GroupDropZone for dropping groups into this group; hidden when dragging a group that's already in this group -->
        <GroupDropZone groupId={id} />
      {/if}
    </div>
  </div>

  {#if showDropPreview}
    <DropPreview
      data-testid="filter-drop-preview"
      id={`filter-drop-preview-${id}`}
      class="max-md:hidden mt-1 rounded-lg"
      label="Subquery"
    />
  {/if}
</div>

<style>
  :root {
    --depth-overlay: 0, 0, 0;
  }
  :global(.dark) {
    --depth-overlay: 255, 255, 255;
  }
</style>

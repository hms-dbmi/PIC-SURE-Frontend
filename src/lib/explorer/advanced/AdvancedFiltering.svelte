<script lang="ts">
  import OperatorBadge from '#lib/ui/OperatorBadge.svelte';
  import { type FilterInterface, createFilterGroup } from '#lib/query/filter.svelte.ts';
  import AdvancedGroup from './AdvancedGroup.svelte';
  import DragOverlayNode from './DragOverlayNode.svelte';
  import GroupDropZone from './GroupDropZone.svelte';
  import SortableProvider from '#lib/ui/sortable/SortableProvider.svelte';
  import { DragOverlay } from '#lib/ui/sortable/sortable.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { LogicTree } from '#lib/query/logicTree.svelte.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import LogicTreeSummary from './LogicTreeSummary.svelte';
  import { cardClass } from '#lib/ui/surface.ts';
  import { FilterTreeEditor, setFilterTreeEditor } from './FilterTreeEditor.svelte.ts';

  const editor = setFilterTreeEditor(
    new FilterTreeEditor(
      (() => {
        try {
          return filterState.tree.clone();
        } catch (e) {
          console.error('Failed to clone filter tree:', e);
          toaster.error({
            description: 'Failed to load saved filter arrangement. Starting fresh.',
          });
          return new LogicTree<FilterInterface>((nodes, op) => createFilterGroup(nodes, op));
        }
      })(),
    ),
  );

  export function applyChanges() {
    filterState.setTree(editor.apply());
  }

  export function hasUnsavedChanges(): boolean {
    return editor.dirty;
  }
</script>

<LogicTreeSummary root={editor.root} genomicFilters={filterState.genomic} />
<div class="flex-1 overflow-auto p-2 border border-surface-300 rounded-lg bg-surface-50 w-full">
  <SortableProvider
    onDragStart={editor.dragStart}
    onDragEnd={editor.dragEnd}
    onDragOver={editor.dragOver}
  >
    <AdvancedGroup group={editor.root} />
    <!-- Root-level drop zone for un-nesting groups; hidden when dragged group is already at root -->
    {#if !(editor.isGroupDrag && editor.activeNode?.parent === editor.root)}
      <GroupDropZone groupId="root" />
    {/if}
    <DragOverlay>
      {#if editor.activeNode}
        <DragOverlayNode node={editor.activeNode} />
      {/if}
    </DragOverlay>
  </SortableProvider>
  {#if filterState.genomic.length > 0}
    <div data-testid="filter-genomic-section">
      {#if editor.root.children.length > 0}
        <div class="flex justify-center pb-3" data-testid="filter-genomic-separator">
          <OperatorBadge operator="AND" tone="neutral" />
        </div>
      {/if}
      {#each filterState.genomic as gFilter (gFilter.id)}
        <div
          class="{cardClass} flex flex-row gap-2 items-center p-4 bg-white opacity-75"
          data-testid="filter-genomic-item"
        >
          <div class="flex items-center">
            <i class="fa-solid fa-dna text-surface-400"></i>
          </div>
          <div class="flex flex-col">
            <div class="text-sm font-medium">{gFilter.variableName}</div>
            {#if gFilter.description}
              <div class="text-xs text-surface-500">{gFilter.description}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

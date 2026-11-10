<script lang="ts">
  import CollapsibleGroup from '#lib/ui/CollapsibleGroup.svelte';
  import CollapsiblePanel from '#lib/ui/CollapsiblePanel.svelte';
  import { buildEquation, type EquationPart } from '#lib/query/logicTreeSummary.ts';
  import type { FilterGroupInterface, FilterInterface } from '#lib/query/filter.svelte.ts';

  interface Props {
    root: FilterGroupInterface;
    genomicFilters?: FilterInterface[];
    widthClass?: string;
  }

  let { root, genomicFilters = [], widthClass = 'w-full' }: Props = $props();

  let parts: EquationPart[] = $derived(buildEquation(root, genomicFilters));
  let openPanels: string[] = $state(['logic-tree']);
</script>

<div class="mb-4 mx-auto {widthClass}" data-testid="filter-logic-summary">
  <CollapsibleGroup value={openPanels} onchange={(value) => (openPanels = value)} collapsible>
    <CollapsiblePanel value="logic-tree">
      {#snippet heading()}Query Summary{/snippet}
      {#if parts.length === 0}
        <p class="italic text-surface-500">Add filters to see the query summary.</p>
      {:else}
        <p data-testid="filter-logic-text">
          {#each parts as part}
            {#if part.type === 'operator'}
              <strong>{` ${part.text} `}</strong>
            {:else}
              {part.text}
            {/if}
          {/each}
        </p>
      {/if}
    </CollapsiblePanel>
  </CollapsibleGroup>
</div>

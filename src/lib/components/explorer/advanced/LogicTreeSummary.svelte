<script lang="ts">
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { buildEquation, type EquationPart } from './logicTreeSummary';
  import type { FilterGroupInterface, FilterInterface } from '$lib/models/Filter.svelte';

  interface Props {
    root: FilterGroupInterface;
    genomicFilters?: FilterInterface[];
  }

  let { root, genomicFilters = [] }: Props = $props();

  let parts: EquationPart[] = $derived(buildEquation(root, genomicFilters));
  let accordionValue: string[] = $state(['logic-tree']);
</script>

<div class="mb-4" data-testid="logic-tree-summary">
  <Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} collapsible>
    {#snippet iconOpen()}<i class="fa-solid fa-angle-up"></i>{/snippet}
    {#snippet iconClosed()}<i class="fa-solid fa-angle-down"></i>{/snippet}
    <Accordion.Item
      value="logic-tree"
      headingLevel={6}
      controlRounded="rounded-t-xl aria-expanded:rounded-b-none rounded-b-xl"
      controlClasses="h6 bg-primary-100-900 hover:bg-secondary-200-800"
      panelClasses="bg-surface-100"
      panelRounded="rounded-b-xl"
    >
      {#snippet control()}Query Summary{/snippet}
      {#snippet panel()}
        {#if parts.length === 0}
          <p class="italic text-surface-500">Add filters to see the query summary.</p>
        {:else}
          <p data-testid="logic-tree-text">
            {#each parts as part}
              {#if part.type === 'operator'}
                {' '}<strong>{part.text}</strong>{' '}
              {:else}
                {part.text}
              {/if}
            {/each}
          </p>
        {/if}
      {/snippet}
    </Accordion.Item>
  </Accordion>
</div>

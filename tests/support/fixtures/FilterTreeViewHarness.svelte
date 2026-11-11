<script lang="ts">
  import FilterTreeView from '#lib/query/components/FilterTreeView.svelte';
  import type { FilterGroupInterface } from '#lib/query/filter.svelte.ts';

  // Writes the tree out as text: filters by name, operators between bars, subqueries in brackets.
  interface Props {
    group: FilterGroupInterface;
  }

  let { group }: Props = $props();
</script>

<p data-testid="tree">
  <FilterTreeView {group}>
    {#snippet filter(filter)}{filter.variableName}{/snippet}
    {#snippet separator(operator)}{`|${operator}|`}{/snippet}
    {#snippet subgroup({ children })}[{@render children()}]{/snippet}
  </FilterTreeView>
</p>

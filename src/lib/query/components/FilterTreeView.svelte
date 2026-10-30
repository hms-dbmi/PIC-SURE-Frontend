<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    isFilterGroup,
    type Filter,
    type FilterGroupInterface,
  } from '#lib/query/filter.svelte.ts';
  import type { OperatorType } from '#lib/query/query.ts';

  interface Props {
    /** Rendered without a wrapper element: the caller lays out the top level. */
    group: FilterGroupInterface;
    filter: Snippet<[Filter]>;
    /** Between two siblings, with their group's operator. */
    separator: Snippet<[OperatorType]>;
    /** Wraps a nested group; `children` renders what is inside it. */
    subgroup: Snippet<[{ group: FilterGroupInterface; children: Snippet }]>;
  }

  let { group, filter, separator, subgroup }: Props = $props();
</script>

{#snippet nodes(parent: FilterGroupInterface)}
  {#each parent.children as child, i (child.uuid)}
    {#if i > 0}
      {@render separator(parent.operator)}
    {/if}
    {#if isFilterGroup(child)}
      {#snippet contents()}
        {@render nodes(child)}
      {/snippet}
      {@render subgroup({ group: child, children: contents })}
    {:else}
      {@render filter(child as Filter)}
    {/if}
  {/each}
{/snippet}

{@render nodes(group)}

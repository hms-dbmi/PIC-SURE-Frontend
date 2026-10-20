<script lang="ts" generics="T extends Row">
  import type { Snippet } from 'svelte';
  import type { AnyTableHandler, Row } from '../types.ts';

  let {
    handler,
    orderBy,
    class: className = '',
    children,
  }: {
    handler: AnyTableHandler<T>;
    orderBy: Extract<keyof T, string>;
    class?: string;
    children?: Snippet;
  } = $props();

  const sort = $derived(handler.createSort(orderBy));
</script>

<th
  scope="col"
  class="select-none align-bottom p-0 {className}"
  class:active={sort.isActive}
  aria-sort={sort.isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
>
  <button type="button" class="w-full p-4 cursor-pointer select-none" onclick={() => sort.set()}>
    {@render children?.()}
    {#if sort.isActive}
      {#if sort.direction === 'asc'}
        <i class="fa-solid fa-sort-up"></i>
      {:else}
        <i class="fa-solid fa-sort-down"></i>
      {/if}
    {:else}
      <i class="fa-solid fa-sort"></i>
    {/if}
  </button>
</th>

<style>
  /* The UA stylesheet centers button text; keep the header's own alignment. */
  button {
    text-align: inherit;
  }
</style>

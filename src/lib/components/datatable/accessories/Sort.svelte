<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';

  let {
    handler,
    orderBy,
    class: className = '',
    children,
  }: {
    handler: TableHandler | RemoteTableHandler;
    orderBy: string;
    class?: string;
    children?: import('svelte').Snippet;
  } = $props();

  const sort = (() => handler.createSort(orderBy))();
</script>

<th
  scope="col"
  class="select-none align-bottom {className}"
  class:active={sort.isActive}
  aria-sort={sort.isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
  style="padding: 0"
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

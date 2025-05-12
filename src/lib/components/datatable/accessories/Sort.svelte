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

  const sort = handler.createSort(orderBy);
</script>

<th
  class="cursor-pointer select-none align-bottom {className}"
  class:active={sort.isActive}
  onclick={() => sort.set()}
>
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
</th>

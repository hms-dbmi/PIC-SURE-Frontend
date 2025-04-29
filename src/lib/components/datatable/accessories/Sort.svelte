<script lang="ts">
  import { TableHandler } from '@vincjo/datatables/server';

  let {
    handler,
    orderBy,
    class: className = '',
    children,
  }: {
    handler: TableHandler;
    orderBy: string;
    class?: string;
    children?: import('svelte').Snippet;
  } = $props();

  const sort = handler.createSort(orderBy);
</script>

<th
  class="cursor-pointer select-none align-bottom {className}"
  class:active={sort.isActive}
  onclick={sort.set}
>
  {@render children?.()}
  <span class:asc={sort.direction === 'asc'} class:desc={sort.direction === 'desc'}></span>
</th>

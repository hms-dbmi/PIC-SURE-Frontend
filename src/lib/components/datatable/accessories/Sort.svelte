<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';

  const {
    handler,
    orderBy,
    class: className = '',
    children,
  }: {
    handler: DataHandler;
    orderBy: string;
    class?: string;
    children?: import('svelte').Snippet;
  } = $props();

  const sorted = handler.getSort();
</script>

<th
  onclick={() => handler.sort(orderBy)}
  class="cursor-pointer select-none align-bottom {className}"
>
  {@render children?.()}
  {#if $sorted.identifier === orderBy}
    {#if $sorted.direction === 'asc'}
      ↓
    {:else if $sorted.direction === 'desc'}
      ↑
    {/if}
  {:else}
    ↕
  {/if}
</th>

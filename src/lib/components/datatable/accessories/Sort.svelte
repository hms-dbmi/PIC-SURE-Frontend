<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';

  let clazz = '';
  export { clazz as class };
  export let handler: DataHandler;
  export let orderBy: string;

  const sorted = handler.getSort();
</script>

<th on:click={() => handler.sort(orderBy)} class={`cursor-pointer select-none ${clazz}`}>
  <div class="flex h-full items-center justify-start gap-x-2">
    <slot />
    {#if $sorted.identifier === orderBy}
      {#if $sorted.direction === 'asc'}
        &darr;
      {:else if $sorted.direction === 'desc'}
        &uarr;
      {/if}
    {:else}
      &updownarrow;
    {/if}
  </div>
</th>

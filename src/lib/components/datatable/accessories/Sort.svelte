<!-- @migration-task Error while migrating Svelte code: Cannot split a chunk that has already been edited (10:18 – "on:click={() => handler.sort(orderBy)}") -->
<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';

  let { 
    class: className,
    handler,
    orderBy
  } = $props();

  const sorted = $derived(handler.getSort());
</script>

<th
  on:click={() => handler.sort(orderBy)}
  class="cursor-pointer select-none align-bottom {className || ''}"
>
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
</th>

<style>
  th {
    font-weight: normal !important;
  }
</style>

<script lang="ts">
  import { TableHandler } from '@vincjo/datatables/server';

  let { handler }: { handler: TableHandler } = $props();

  let { start, end, total } = $derived(handler.rowCount);
</script>

<aside class="text-sm leading-8 mr-6">
  {#if total > 0}
    <b>{start}</b>
    - <b>{end}</b>
    / <b>{total}</b>
  {/if}
</aside>

<script lang="ts" generics="T extends Row">
  import type { AnyTableHandler, Row } from '../types.ts';

  let { handler }: { handler: AnyTableHandler<T> } = $props();

  let { start, end, total } = $derived(handler.rowCount);
</script>

<aside class="text-sm leading-8 mr-6">
  {#if total > 0}
    <b>{start}</b>
    - <b>{end}</b>
    / <b>{total}</b>
  {/if}
</aside>

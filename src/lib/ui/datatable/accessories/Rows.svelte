<script lang="ts" generics="T extends Row">
  import type { AnyTableHandler, Row } from '../types.ts';
  import { getTableEvents, hasTableEvents } from '../context.ts';

  import { setDefaultRows } from '../rowsPerPage.ts';

  interface Props {
    tableName: string;
    handler: AnyTableHandler<T>;
    options?: number[];
    class?: string;
  }

  let { tableName, handler, options = [5, 10, 20, 50], class: className = '' }: Props = $props();
  const events = hasTableEvents() ? getTableEvents() : undefined;

  const setRowsPerPage = () => {
    setDefaultRows(tableName, handler.rowsPerPage);
    handler.setPage(1);
    events?.pageSizeChange(handler.rowsPerPage);
  };
</script>

<aside class={className}>
  <label class="flex place-items-center"
    >Show
    <select
      class="ml-2 rounded-xl"
      aria-label="Rows per page"
      bind:value={handler.rowsPerPage}
      onchange={setRowsPerPage}
    >
      {#each options as option}
        <option value={option}>
          {option}
        </option>
      {/each}
    </select>
  </label>
</aside>

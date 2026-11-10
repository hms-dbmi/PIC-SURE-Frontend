<script lang="ts" generics="T extends Row">
  import { TableHandler as ServerTableHandler } from '@vincjo/datatables/server';
  import type { AnyTableHandler, Row } from '../types.ts';

  interface Props {
    handler: AnyTableHandler<T>;
    filterBy: Extract<keyof T, string>;
    class?: string;
  }

  let { handler, filterBy, class: className = '' }: Props = $props();

  const filter = $derived(handler.createFilter(filterBy));
  let timeout: ReturnType<typeof setTimeout>;

  const setFilter = () => {
    filter.set();
    if (handler instanceof ServerTableHandler) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handler.invalidate();
      }, 400);
    }
  };
</script>

<th scope="col" class={className}>
  <input
    type="text"
    class="input text-sm w-full"
    placeholder="Filter"
    bind:value={filter.value}
    oninput={setFilter}
  />
</th>

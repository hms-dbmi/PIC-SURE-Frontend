<script lang="ts">
  import { TableHandler } from '@vincjo/datatables';
  import { TableHandler as RemoteTableHandler } from '@vincjo/datatables/server';

  interface Props {
    handler: TableHandler | RemoteTableHandler;
    filterBy: string;
    class?: string;
  }

  let { handler, filterBy, class: className = '' }: Props = $props();

  const filter = handler.createFilter(filterBy);
  let timeout: ReturnType<typeof setTimeout>;

  const setFilter = () => {
    filter.set();
    if (handler instanceof RemoteTableHandler) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handler.invalidate();
      }, 400);
    }
  };
</script>

<th class={className}>
  <input
    type="text"
    class="input text-sm w-full"
    placeholder="Filter"
    bind:value={filter.value}
    oninput={setFilter}
  />
</th>

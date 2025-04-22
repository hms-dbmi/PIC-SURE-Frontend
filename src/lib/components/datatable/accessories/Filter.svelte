<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteDataHandler } from '@vincjo/datatables/remote';

  interface Props {
    handler: DataHandler | RemoteDataHandler;
    filterBy: string;
    class?: string;
  }

  const { handler, filterBy, class: className = '' }: Props = $props();
  let timeout: ReturnType<typeof setTimeout>;

  let value: string = $state('');
  const filter = () => {
    handler.filter(value, filterBy);
    if (handler instanceof RemoteDataHandler) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handler.invalidate();
      }, 400);
    }
  };
</script>

<th class={className}>
  <input
    class="input text-sm w-full"
    type="text"
    placeholder="Filter"
    bind:value
    oninput={filter}
  />
</th>

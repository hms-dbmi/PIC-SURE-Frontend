<script lang="ts">
  import type { DataHandler } from '@vincjo/datatables';
  import { DataHandler as RemoteDataHandler } from '@vincjo/datatables/remote';

  interface Props {
    handler: DataHandler | RemoteDataHandler;
    filterBy: string;
    class: string;
  }

  let { ...props }: Props = $props();
  let timeout: ReturnType<typeof setTimeout>;

  let value: string = $state();
  const filter = () => {
    props.handler.filter(value, props.filterBy);
    if (props.handler instanceof RemoteDataHandler) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        props.handler.invalidate();
      }, 400);
    }
  };
</script>

<th class={props.class ?? ''}>
  <input
    class="input text-sm w-full"
    type="text"
    placeholder="Filter"
    bind:value
    oninput={filter}
  />
</th>

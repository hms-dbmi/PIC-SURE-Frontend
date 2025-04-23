<script lang="ts">
  import { parseFieldsFromJSON } from '$lib/models/Connection';
  interface Props {
    data?: { cell: string };
  }

  let { data = { cell: '[]' } }: Props = $props();
  let fields = $derived(parseFieldsFromJSON(data.cell));
</script>

{#each fields as field, index (index)}
  <span class="badge preset-tonal-surface border border-surface-500 font-normal m-1"
    ><span class="font-bold">{field.label}</span>:{field.id}</span
  >
{/each}

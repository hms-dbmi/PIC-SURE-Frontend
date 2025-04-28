<script lang="ts">
  import { parseFieldsFromJSON } from '$lib/models/Connection';
  export let data: { cell: string } = { cell: '[]' };
  $: fields = parseFieldsFromJSON(data.cell);
</script>

{#each fields as field, index (index)}
  <span class="badge variant-ghost-surface font-normal m-1"
    ><span class="font-bold">{field.label}</span>:{field.id}</span
  >
{/each}

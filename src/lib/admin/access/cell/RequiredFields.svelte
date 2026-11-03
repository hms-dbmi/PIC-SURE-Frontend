<script lang="ts">
  import { parseFieldsFromJSON } from '#lib/auth/model/connection.ts';
  import { tones } from '#lib/ui/surface.ts';
  interface Props {
    // The connection's required fields, as stored: a JSON array.
    requiredFields?: string;
  }

  let { requiredFields = '[]' }: Props = $props();
  let fields = $derived(parseFieldsFromJSON(requiredFields));
</script>

{#each fields as field, index (index)}
  <span class="badge {tones['tonal-surface']} border border-surface-500 font-normal m-1"
    ><span class="font-bold">{field.label}</span>:{field.id}</span
  >
{/each}

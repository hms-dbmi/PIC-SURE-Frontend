<script lang="ts">
  import { tones } from '#lib/ui/surface.ts';
  let { data = { cell: '', row: {} } } = $props();

  const presets: { [status: string]: string } = {
    Active: tones['filled-success'],
    Revoked: tones['filled-error'],
    Expired: tones['filled-warning'],
  };
</script>

<span class="badge last:p-1 rounded-sm {presets[data.cell] || tones['tonal-surface']}"
  >{data.cell}</span
>

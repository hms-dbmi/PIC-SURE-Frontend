<script lang="ts">
  import { tones } from '#lib/ui/surface.ts';
  interface Props {
    data?: { cell: string; row: unknown };
  }

  let { data = { cell: '', row: {} } }: Props = $props();
</script>

<span
  class="badge last:p-1 rounded-sm {data.cell === 'Active'
    ? tones['filled-success']
    : tones['filled-error']}">{data.cell}</span
>

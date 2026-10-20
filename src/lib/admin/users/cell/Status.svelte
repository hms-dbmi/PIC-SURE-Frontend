<script lang="ts">
  import { tones } from '#lib/ui/surface.ts';
  interface Props {
    status: string;
  }

  let { status }: Props = $props();
</script>

<span
  class="badge last:p-1 rounded-sm {status === 'Active'
    ? tones['filled-success']
    : tones['filled-error']}">{status}</span
>

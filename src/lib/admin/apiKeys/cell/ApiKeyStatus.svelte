<script lang="ts">
  import { tones } from '#lib/ui/surface.ts';
  interface Props {
    status: string;
  }

  let { status }: Props = $props();

  const statusTones: { [status: string]: string } = {
    Active: tones['filled-success'],
    Revoked: tones['filled-error'],
    Expired: tones['filled-warning'],
  };
</script>

<span class="badge last:p-1 rounded-sm {statusTones[status] || tones['tonal-surface']}"
  >{status}</span
>

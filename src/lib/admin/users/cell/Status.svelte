<script lang="ts">
  interface Props {
    data?: { cell: string; row: unknown };
  }

  let { data = { cell: '', row: {} } }: Props = $props();
</script>

<span
  class="badge last:p-1 rounded-sm {data.cell === 'Active'
    ? 'preset-filled-success-500'
    : 'preset-filled-error-500'}">{data.cell}</span
>

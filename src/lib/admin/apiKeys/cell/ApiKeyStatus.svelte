<script lang="ts">
  let { data = { cell: '', row: {} } } = $props();

  const presets: { [status: string]: string } = {
    Active: 'preset-filled-success-500',
    Revoked: 'preset-filled-error-500',
    Expired: 'preset-filled-warning-500',
  };
</script>

<span class="badge last:p-1 rounded-sm {presets[data.cell] || 'preset-tonal-surface'}"
  >{data.cell}</span
>

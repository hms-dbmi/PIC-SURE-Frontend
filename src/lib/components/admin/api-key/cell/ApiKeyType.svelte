<script lang="ts">
  let { data = { cell: '', row: {} } } = $props();
</script>

<span
  class="badge last:p-1 rounded-sm {data.cell === 'PLATFORM'
    ? 'preset-tonal-primary border border-primary-500'
    : 'preset-tonal-surface border border-surface-500'}">{data.cell}</span
>

<script lang="ts">
  let { data = { cell: '', row: {} } } = $props();
</script>

<span
  class={`badge last:p-1 rounded-sm preset-filled-${data.cell === 'Active' ? 'success' : 'error'}-500`}
  >{data.cell}</span
>

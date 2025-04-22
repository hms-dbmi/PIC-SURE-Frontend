<script lang="ts">
  let { data = { cell: '', row: {} } } = $props();
</script>

<span
  class={`badge last:p-1 rounded variant-filled-${data.cell === 'Active' ? 'success' : 'error'}`}
  >{data.cell}</span
>

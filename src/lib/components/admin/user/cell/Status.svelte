<script lang="ts">
  export let data = { cell: '', row: {} };
</script>

<span
  class={`badge last:p-1 rounded variant-filled-${data.cell === 'Active' ? 'success' : 'error'}`}
  >{data.cell}</span
>

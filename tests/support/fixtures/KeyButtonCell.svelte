<script lang="ts">
  let { data = { row: {} } } = $props();
</script>

<button
  type="button"
  data-key="x"
  title="Act (x)"
  onclick={(event) => {
    event.stopPropagation();
    data.row.onAction?.();
  }}
>
  Act
</button>

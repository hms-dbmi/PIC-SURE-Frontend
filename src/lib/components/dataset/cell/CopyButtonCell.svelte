<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';

  let { data = { cell: '', row: {} } } = $props();
</script>

<div class="flex items-center">
  <span class="monospace">{data.cell}</span>
  <CopyButton
    data-testid="{data.cell}-copy"
    useIcon
    triggerTitle="Copy dataset ID (c)"
    data-key="c"
    itemToCopy={data.cell}
    logAction="dataset.copy_id"
    logMetadata={{ value: data.cell }}
  />
</div>

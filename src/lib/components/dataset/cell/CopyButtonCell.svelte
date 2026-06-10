<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import { log, createLog } from '$lib/logger';

  let { data = { cell: '', row: {} } } = $props();
</script>

<div class="flex items-center">
  <span class="monospace">{data.cell}</span>
  <CopyButton
    data-testid="{data.cell}-copy"
    useIcon
    itemToCopy={data.cell}
    oncopy={() => log(createLog('ACTION', 'dataset.copy_id', { value: data.cell }))}
  />
</div>

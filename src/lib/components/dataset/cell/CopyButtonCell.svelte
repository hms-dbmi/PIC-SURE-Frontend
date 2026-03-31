<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import { log, createLog } from '$lib/logger';

  let { data = { cell: '', row: {} } } = $props();
</script>

<div
  class="flex items-center"
  role="button"
  tabindex="-1"
  onclick={() => log(createLog('ACTION', 'dataset.copy_id', { value: data.cell }))}
  onkeydown={(e) => e.key === 'Enter' && log(createLog('ACTION', 'dataset.copy_id', { value: data.cell }))}
>
  <span class="monospace">{data.cell}</span>
  <CopyButton data-testid="{data.cell}-copy" useIcon itemToCopy={data.cell} />
</div>

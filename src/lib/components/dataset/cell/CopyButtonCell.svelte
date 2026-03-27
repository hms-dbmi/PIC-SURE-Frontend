<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import { log, createLog } from '$lib/logger';

  let { data = { cell: '', row: {} } } = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
  class="flex items-center"
  onclick={() => log(createLog('ACTION', 'dataset.copy_id', { value: data.cell }))}
>
  <span class="monospace">{data.cell}</span>
  <CopyButton data-testid="{data.cell}-copy" useIcon itemToCopy={data.cell} />
</div>

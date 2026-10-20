<script lang="ts">
  import CopyButton from '#lib/ui/CopyButton.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  interface Props {
    value: string;
  }

  let { value }: Props = $props();
</script>

<div class="flex items-center">
  <span class="monospace">{value}</span>
  <CopyButton
    data-testid="dataset-query-copy-{value}"
    useIcon
    triggerTitle="Copy dataset ID (c)"
    data-key="c"
    itemToCopy={value}
    oncopy={() => log(createLog('ACTION', 'dataset.copy_id', { value }))}
  />
</div>

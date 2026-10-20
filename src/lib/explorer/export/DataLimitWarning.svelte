<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';

  let { 'data-testid': testId }: { 'data-testid': string } = $props();
</script>

<ErrorAlert
  data-testid={testId}
  title="Warning"
  color="warning"
  closeText="Back"
  onclose={() => goto(resolve('explorer'))}
>
  Warning: Your selected data exceeds {exportState.maxDataPoints.toLocaleString('en-US')} estimated data
  points, which is too large to export. Please reduce the data selection or the number of selected participants.
</ErrorAlert>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { exportState } from '#lib/explorer/export/export.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';

  let { 'data-testid': testId }: { 'data-testid': string } = $props();
</script>

<!-- Nothing while the participant count loads; the step stays locked meanwhile. -->
{#if exportState.sizeCheck === 'over' || exportState.sizeCheck === 'unknown'}
  <ErrorAlert
    data-testid={testId}
    title="Warning"
    color="warning"
    closeText="Back"
    onclose={() => goto(resolve('explorer'))}
  >
    {#if exportState.sizeCheck === 'over'}
      Warning: Your selected data exceeds {exportState.maxDataPoints.toLocaleString('en-US')} estimated
      data points, which is too large to export. Please reduce the data selection or the number of selected
      participants.
    {:else}
      We couldn't count the participants in your cohort, so the size of this export can't be
      checked. Please try again later.
    {/if}
  </ErrorAlert>
{/if}

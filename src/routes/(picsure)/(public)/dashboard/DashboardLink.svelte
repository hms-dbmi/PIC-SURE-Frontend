<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import type { DashboardRow } from './dashboard.svelte.ts';

  interface Props {
    row: DashboardRow;
  }

  let { row }: Props = $props();
  let link = $derived(row.additional_info_link as string);
  let consentGranted = $derived(row.consentGranted);
  let dataset = $derived(row.dataset_id as string);
</script>

{#if consentGranted}
  <i class="fa-regular fa-circle-check text-3xl text-success-500"></i>
{:else if link}
  <Button
    variant="tonal"
    href={link}
    rel="external"
    title="More Info"
    target="_blank"
    onclick={(e) => {
      e.stopPropagation();
      log(createLog('ACTION', 'dashboard.more_info_table', { dataset, url: link }));
    }}>More Info</Button
  >
{:else}
  <Button title="Link not available" variant="tonal-static" class="opacity-50" disabled
    >More Info</Button
  >
{/if}

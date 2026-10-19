<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let { data = { row: { additional_info_link: '', consentGranted: false } } } = $props();
  let link = $derived(data.row.additional_info_link as string);
  let consentGranted = $derived(data.row.consentGranted);
  let dataset = $derived(data.row.dataset_id as string);
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

<script lang="ts">
  import { log, createLog } from '$lib/logger';

  let { data = { row: { additional_info_link: '', consentGranted: false } } } = $props();
  let link = $derived(data.row.additional_info_link as string);
  let consentGranted = $derived(data.row.consentGranted);
  let dataset = $derived(data.row.dataset_id as string);
</script>

{#if consentGranted}
  <i class="fa-regular fa-circle-check text-3xl text-success-500"></i>
{:else}
  <a
    href={link || '#'}
    title={link ? 'More Info' : 'Link not available'}
    class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!link
      ? 'opacity-50 cursor-not-allowed'
      : ''}"
    target="_blank"
    onclick={(e) => {
      e.stopPropagation();
      log(createLog('ACTION', 'dashboard.more_info_table', { dataset, url: link }));
    }}>More Info</a
  >
{/if}

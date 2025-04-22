<script lang="ts">
  let { data = { row: { additional_info_link: '', consentGranted: false } } } = $props();
  let link = data.row.additional_info_link as string;
  let consentGranted = data.row.consentGranted;
</script>

{#if consentGranted}
  <i class="fa-regular fa-circle-check text-3xl text-success-500"></i>
{:else}
  <a
    href={link || '#'}
    title={link ? 'More Info' : 'Link not available'}
    class="btn variant-ghost-primary hover:variant-filled-primary{!link
      ? ' opacity-50 cursor-not-allowed'
      : ''}"
    target="_blank">More Info</a
  >
{/if}

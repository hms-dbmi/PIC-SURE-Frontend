<script lang="ts">
  export let data = { row: { additional_info_link: '', consentGranted: false } };
  let link = data.row.additional_info_link as string;
  let consentGranted = data.row.consentGranted;
</script>

{#if consentGranted}
  <i class="fa-regular fa-circle-check text-3xl text-success-500"></i>
{:else}
  <a href={link} class="btn variant-ghost-primary hover:variant-filled-primary" target="_blank"
    >More Info</a
  >
{/if}

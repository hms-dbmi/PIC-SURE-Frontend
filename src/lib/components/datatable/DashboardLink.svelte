<script lang="ts">
  export let href: string;
  export let consentGranted: boolean;
</script>

{#if consentGranted}
  <i class="fa-regular fa-circle-check text-3xl text-success-500"></i>
{:else}
  <a {href} class="btn variant-ghost-primary hover:variant-filled-primary" target="_blank"
    >More Info</a
  >
{/if}

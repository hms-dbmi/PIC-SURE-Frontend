<script lang="ts">
  import { config } from '$lib/configuration.svelte';
</script>

{#if config.branding.explorePage.goTo.links.length > 0}
  <div class="flex justify-center">
    {#each config.branding.explorePage.goTo.links as link}
      <a
        class="btn preset-tonal-primary border border-primary-500 m-2 hover:preset-filled-primary-500"
        href={link.url}
        target={link.newTab ? '_blank' : '_self'}>{link.title}</a
      >
    {/each}
  </div>
{/if}

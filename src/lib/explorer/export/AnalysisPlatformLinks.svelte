<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
</script>

{#if config.branding.explorePage.goTo.links.length > 0}
  <div class="flex justify-center">
    {#each config.branding.explorePage.goTo.links as link}
      <Button
        variant="tonal"
        class="m-2"
        href={link.url}
        rel="external"
        target={link.newTab ? '_blank' : '_self'}
        onclick={() =>
          log(createLog('EXPORT', 'export.go_to_platform', { title: link.title, url: link.url }))}
        >{link.title}</Button
      >
    {/each}
  </div>
{/if}

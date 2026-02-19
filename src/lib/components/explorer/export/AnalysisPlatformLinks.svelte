<script lang="ts">
  import { branding } from '$lib/configuration';
  import { log, createLog } from '$lib/logger';
</script>

{#if branding.explorePage.goTo.links.length > 0}
  <div class="flex justify-center">
    {#each branding.explorePage.goTo.links as link}
      <a
        class="btn preset-tonal-primary border border-primary-500 m-2 hover:preset-filled-primary-500"
        href={link.url}
        target={link.newTab ? '_blank' : '_self'}
        onclick={() => log(createLog('EXPORT', 'export.go_to_platform', { title: link.title, url: link.url }))}
        >{link.title}</a
      >
    {/each}
  </div>
{/if}

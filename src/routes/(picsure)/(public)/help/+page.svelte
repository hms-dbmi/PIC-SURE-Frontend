<script lang="ts">
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/utils/appPath.ts';
  import Content from '#lib/shell/Content.svelte';
  import CardButton from '#lib/ui/CardButton.svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Help</title>
</svelte:head>
<Content title="Knowledge Hub">
  <section id="app-help-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
    {#each config.branding.help.links as link}
      <CardButton
        href={link.url.startsWith('/') ? resolve(appPath(link.url)) : link.url}
        title={link.title}
        subtitle={link.description}
        icon="{link.icon} text-primary-600-400"
        onclick={() =>
          log(createLog('NAVIGATION', 'help.link_click', { title: link.title, url: link.url }))}
      />
    {/each}
  </section>
</Content>

<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
</script>

<svelte:head>
  <title>{branding.applicationName} | Help</title>
</svelte:head>
<Content title="Knowledge Hub" subtitle="Self-service learning resources">
  <section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
    {#each branding.help.links as link}
      <a
        href={link.url}
        target="_blank"
        tabindex="0"
        class="btn variant-soft-primary flex flex-col h-full rounded-lg p-4"
      >
        <i style="display:inline-block;" class={link.icon} />
        <div class="m-1">{link.title}</div>
        <div class="pic-text-wrap w-full m-2">{link.description}</div>
      </a>
    {/each}
  </section>
</Content>

<style>
  .pic-text-wrap {
    text-wrap: wrap;
  }
</style>

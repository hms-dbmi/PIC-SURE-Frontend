<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import CardButton from '$lib/components/buttons/CardButton.svelte';
  import { branding } from '$lib/configuration';
</script>

<svelte:head>
  <title>{branding.applicationName} | Help</title>
</svelte:head>
<Content title="Knowledge Hub">
  <section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
    {#each branding?.help?.links as link}
      <CardButton
        data-testid="variant-explorer-btn"
        href={link.url}
        title={link.title}
        subtitle={link.description}
        icon="{link.icon} text-primary-500-400-token"
      />
    {/each}
  </section>
</Content>

<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
</script>

<Content title="Knowledge Hub" subtitle="Self-service learning resources">
  <section
    id="info-cards"
    class="block-buttons w-full flex flex-wrap flex-row justify-between mt-6"
  >
    {#each branding.help.links as link}
      <a href={link.url} target="_blank" tabindex="0" class="card card-hover">
        <i class={link.icon} />
        <div class="subtitle">{link.title}</div>
        <div>{link.description}</div>
      </a>
    {/each}
  </section>
</Content>

<style>
  .block-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .block-buttons a {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    display: flex;
    text-align: center;
    width: 12rem;
    max-width: 25rem;
    min-height: 15rem;
    padding: 1rem 0.5rem;
    margin: 0.6rem;
  }
  .block-buttons .subtitle {
    margin: 0.75rem;
    font-size: 1.25rem;
    line-height: 1.75rem;
    color: rgb(var(--color-tertiary-900));
    margin: 1rem 0.25rem;
  }
</style>

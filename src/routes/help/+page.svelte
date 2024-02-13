<script lang="ts">
  import Content from '$lib/content.svelte';
  import { branding } from '$lib/configuration';
</script>

<Content title="Knowledge Hub" subtitle="Self-service learning resources">
  <div class="block-buttons">
    {#each branding.help.links as link}
      <a href={link.url} target="_blank" tabindex="0">
        <i class={link.icon} />
        <div class="subtitle">{link.title}</div>
        <div>{link.description}</div>
      </a>
    {/each}
  </div>
</Content>

<script lang="ts">
  import { LightSwitch } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  export let showSitemap = branding.footer.addSitemap;
</script>

{#if showSitemap && branding.sitemap.length > 0}
  <div id="sitemap-footer">
    <div class="flex flex-wrap place-content-center">
      {#each branding.sitemap as section}
        <ul class="basis-1/4">
          <li class="font-bold">{section.category}</li>
          {#each section.links as link}
            <li><a target={link.newTab ? '_blank' : '_self'} href={link.url}>{link.title}</a></li>
          {/each}
        </ul>
      {/each}
    </div>
  </div>
{/if}
<footer id="main-footer" class="flex">
  <LightSwitch />
  <ul>
    {#each branding.footer.links as link}
      <li><a target={link.newTab ? '_blank' : '_self'} href={link.url}>{link.title}</a></li>
    {/each}
  </ul>
</footer>

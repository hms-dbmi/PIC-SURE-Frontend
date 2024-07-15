<script lang="ts">
  import { LightSwitch } from '@skeletonlabs/skeleton';
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  import { page } from '$app/stores';
  import { branding } from '$lib/configuration';
  import { user } from '$lib/stores/User';

  import TermsModal from './TermsModal.svelte';
  export let showSitemap: boolean = branding.footer.showSitemap;

  $: hideSitemap =
    !showSitemap ||
    branding.footer.excludeSitemapOn.find((hide) => $page.url.pathname.includes(hide));

  $: sitemap = branding.sitemap.map((section) => ({
    ...section,
    show: !section.privilege || ($user.privileges && $user.privileges.includes(section.privilege)),
  }));

  function openTermsModal() {
    modalStore.trigger({
      type: 'component',
      component: 'modalWrapper',
      meta: { component: TermsModal, width: 'w-3/4' },
    });
  }
</script>

{#if !hideSitemap && branding.sitemap.length > 0}
  <div id="sitemap-footer">
    <div class="flex flex-wrap place-content-center">
      {#each sitemap as section}
        {#if section.show}
          <ul class="basis-1/8">
            <li class="font-bold text-center">{section.category}</li>
            {#each section.links as link}
              <li class="text-center">
                <a
                  target={link.newTab ? '_blank' : '_self'}
                  href={link.url}
                  class="hover:text-primary-600-300-token hover:underline">{link.title}</a
                >
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    </div>
  </div>
{/if}
<footer id="main-footer" class="flex">
  <LightSwitch />
  <ul>
    <li><button on:click={openTermsModal}>Terms of Service</button></li>
    {#each branding.footer.links as link}
      <li><a target={link.newTab ? '_blank' : '_self'} href={link.url}>{link.title}</a></li>
    {/each}
  </ul>
</footer>

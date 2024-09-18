<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  import { page } from '$app/stores';
  import { branding } from '$lib/configuration';
  import { user } from '$lib/stores/User';

  import TermsModal from '$lib/components/TermsModal.svelte';
  export let showSitemap: boolean = branding?.footer?.showSitemap || false;

  $: hideSitemap =
    !showSitemap ||
    branding?.footer?.excludeSitemapOn?.find((hide) => $page.url.pathname.includes(hide));

  $: sitemap = branding?.sitemap?.map((section) => ({
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

{#if !hideSitemap && branding?.sitemap?.length > 0}
  <div id="sitemap-footer">
    <div class="flex flex-wrap place-content-center">
      {#each sitemap as section}
        {#if section.show}
          <ul class="basis-1/8">
            <li class="font-bold text-center">{section.category}</li>
            {#each section.links as link}
              <li class="text-center">
                <a target={link.newTab ? '_blank' : '_self'} href={link.url} class="hover:underline"
                  >{link.title}</a
                >
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    </div>
  </div>
{/if}
<footer id="main-footer" class="flex relative">
  <ul>
    {#if branding?.footer?.showTerms}
      <li><button class="hover:underline" on:click={openTermsModal}>Terms of Service</button></li>
    {/if}
    {#each branding?.footer?.links as link}
      <li>
        <a class="hover:underline text-xs" target={link.newTab ? '_blank' : '_self'} href={link.url}
          >{link.title}</a
        >
      </li>
    {/each}
  </ul>
</footer>

<style lang="postcss">
  #sitemap-footer {
    padding: 0.5em 0 0;
    margin: 0 auto;
    text-align: center;
    padding: 1em 15%;
  }
  #sitemap-footer ul {
    text-align: left;
    margin: 0 2em;
  }
</style>

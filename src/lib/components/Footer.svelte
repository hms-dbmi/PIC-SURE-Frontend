<script lang="ts">
  import { page } from '$app/state';
  import { branding, features } from '$lib/configuration';
  import { user } from '$lib/stores/User';

  import Modal from '$lib/components/Modal.svelte';

  // Ideally, this should be a value from the database that has timestamps, author, etc.
  // For now, the easiest place to find and update the html used here is in the src folder.
  import Terms from '../../terms.svelte';

  let {
    showSitemap = branding?.footer?.showSitemap || false,
  }: {
    showSitemap?: boolean;
  } = $props();

  let hideSitemap = $derived(
    !showSitemap ||
      branding?.footer?.excludeSitemapOn?.find((hide) => page.url.pathname.includes(hide)),
  );

  let sitemap = $derived(
    branding?.sitemap?.map((section) => ({
      ...section,
      show:
        (!section.privilege ||
          ($user.privileges && $user.privileges.includes(section.privilege))) &&
        (!section.feature || features[section.feature as keyof typeof features]),
    })),
  );

  let modalOpen = $state(false);
</script>

{#if !hideSitemap && branding?.sitemap?.length > 0}
  <div id="sitemap-footer">
    <div class="flex flex-wrap place-content-center">
      {#each sitemap as section}
        {#if section.show}
          <ul class="basis-1/8">
            <li class="font-bold text-center">{section.category}</li>
            {#each section.links as link}
              {#if !link.feature || features[link.feature]}
                <li class="text-center">
                  <a
                    target={link.newTab ? '_blank' : '_self'}
                    href={link.url}
                    class="hover:underline">{link.title}</a
                  >
                </li>
              {/if}
            {/each}
          </ul>
        {/if}
      {/each}
    </div>
  </div>
{/if}
<footer id="main-footer" class="flex relativem mt-4">
  <ul>
    {#if features.termsOfService}
      <li>
        <Modal
          bind:open={modalOpen}
          width="w-3/4"
          height="h-full"
          withDefault={false}
          footerButtons={false}
          triggerBase="hover:underline text-[0.74rem]"
        >
          {#snippet trigger()}Terms of Service{/snippet}
          <div id="terms-of-service"><Terms /></div>
          <div class="text-right">
            <button
              class="btn preset-filled-primary-500 hover:preset-filled-secondary-500"
              onclick={() => (modalOpen = false)}>Accept</button
            >
          </div>
        </Modal>
      </li>
    {/if}
    {#each branding?.footer?.links as link}
      <li>
        <a
          class="hover:underline text-[0.74rem]"
          target={link.newTab ? '_blank' : '_self'}
          href={link.url}>{link.title}</a
        >
      </li>
    {/each}
  </ul>
</footer>

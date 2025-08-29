<script lang="ts">
  import { page } from '$app/state';
  import { branding, features } from '$lib/stores/Configuration';
  import { user, isLoggedIn } from '$lib/stores/User';
  import Terms from '$lib/components/Terms.svelte';
  import Modal from '$lib/components/Modal.svelte';

  let { showSitemap = $branding.footer.showSitemap || false }: { showSitemap?: boolean } = $props();

  let hideSitemap = $derived(
    !showSitemap ||
      $branding.footer.excludeSitemapOn?.find((hide) => page.url.pathname.includes(hide)),
  );

  let sitemap = $derived(
    $branding.sitemap.map((section) => ({
      ...section,
      show:
        (!section.privilege ||
          ($user.privileges && $user.privileges.includes(section.privilege))) &&
        (!section.feature || !!$features[section.feature as keyof typeof $features]),
    })) || [],
  );

  let modalOpen: boolean = $state(
    $features.enforceTermsOfService && $isLoggedIn && !$user.acceptedTOS,
  );
  let modalClosable: boolean = $derived(
    !$features.enforceTermsOfService || !$isLoggedIn || ($isLoggedIn && !!$user?.acceptedTOS),
  );
</script>

{#if (!hideSitemap && $branding.sitemap.length) || 0 > 0}
  <div id="sitemap-footer">
    <div class="flex flex-wrap place-content-center">
      {#each sitemap as section}
        {#if section.show}
          <ul class="basis-1/8">
            <li class="font-bold text-center">{section.category}</li>
            {#each section.links as link}
              {#if !link.feature || $features[link.feature as keyof typeof $features]}
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
    {#if $features.termsOfService}
      <li>
        <Modal
          bind:open={modalOpen}
          data-testid="terms-of-service"
          width="w-3/4"
          height="h-full"
          triggerBase="hover:underline text-[0.74rem]"
          withDefault={false}
          footerButtons={false}
          closeable={modalClosable}
        >
          {#snippet trigger()}Terms of Service{/snippet}
          <Terms bind:modalOpen />
        </Modal>
      </li>
    {/if}
    {#each $branding.footer.links as link}
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

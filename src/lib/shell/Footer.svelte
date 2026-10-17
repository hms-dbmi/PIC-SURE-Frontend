<script lang="ts">
  import { page } from '$app/state';
  import { config } from '#lib/config/config.svelte.ts';
  import { user, isUserLoggedIn } from '#lib/auth/User.ts';
  import Terms from '#lib/shell/Terms.svelte';
  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  let { showSitemap: showSitemapProp }: { showSitemap?: boolean } = $props();
  let showSitemap = $derived(showSitemapProp ?? (config.branding.footer.showSitemap || false));

  let hideSitemap = $derived(
    !showSitemap ||
      config.branding.footer.excludeSitemapOn.find((hide) => page.url.pathname.includes(hide)),
  );

  let sitemap = $derived(
    config.branding.sitemap.map((section) => ({
      ...section,
      show:
        (!section.privilege ||
          ($user.privileges && $user.privileges.includes(section.privilege))) &&
        (!section.feature || config.features[section.feature]),
    })),
  );

  let modalOpen: boolean = $state(
    config.features.enforceTermsOfService && isUserLoggedIn() && !$user.acceptedTOS,
  );
  let modalClosable: boolean = $derived(
    !config.features.enforceTermsOfService ||
      !isUserLoggedIn() ||
      (isUserLoggedIn() && !!$user?.acceptedTOS),
  );
</script>

{#if !hideSitemap && config.branding.sitemap.length > 0}
  <div id="app-footer-sitemap">
    <div class="flex flex-wrap place-content-center">
      {#each sitemap as section}
        {#if section.show}
          <ul class="basis-1/8">
            <li class="font-bold text-center">{section.category}</li>
            {#each section.links as link}
              {#if !link.feature || config.features[link.feature]}
                <li class="text-center">
                  <a
                    target={link.newTab ? '_blank' : '_self'}
                    rel="external"
                    href={link.url}
                    class="hover:underline"
                    onclick={() =>
                      log(
                        createLog('NAVIGATION', 'sitemap.link_click', {
                          title: link.title,
                          url: link.url,
                          category: section.category,
                        }),
                      )}>{link.title}</a
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
<footer id="app-footer" class="flex relativem">
  <ul>
    {#if config.features.termsOfService}
      <li>
        <Dialog
          bind:open={modalOpen}
          data-testid="app-footer-terms"
          size="page"
          triggerClass="hover:underline text-[0.74rem]"
          ontrigger={() => log(createLog('NAVIGATION', 'footer.tos_click'))}
          closeable={modalClosable}
        >
          {#snippet trigger()}Terms of Service{/snippet}
          <Terms bind:modalOpen />
        </Dialog>
      </li>
    {/if}
    {#each config.branding.footer.links as link}
      <li>
        <a
          class="hover:underline text-[0.74rem]"
          target={link.newTab ? '_blank' : '_self'}
          rel="external"
          href={link.url}
          onclick={() =>
            log(createLog('NAVIGATION', 'footer.link_click', { title: link.title, url: link.url }))}
          >{link.title}</a
        >
      </li>
    {/each}
  </ul>
</footer>

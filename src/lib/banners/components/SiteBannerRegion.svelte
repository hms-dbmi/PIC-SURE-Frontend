<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { onDestroy, tick } from 'svelte';
  import { bannerPlainText } from '#lib/banners/model/html.ts';
  import { truncate } from '#lib/utils/strings.ts';
  import { createLog, log } from '#lib/telemetry/logger.ts';
  import type { ActiveBanner, BannerAudience } from '#lib/banners/model/banner.ts';
  import { BANNER_LABEL_LENGTH } from '#lib/banners/model/limits.ts';
  import { parseBannerFeed } from '#lib/banners/model/feed.ts';
  import { getActiveBanners } from '#lib/api/picsure/banners.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import SiteBanner from '#lib/banners/components/SiteBanner.svelte';
  import LiveRegion from '#lib/ui/LiveRegion.svelte';
  import { createAnnouncer } from '#lib/ui/announcer.svelte.ts';
  import { matchesBannerPageTargets } from '#lib/banners/model/pageTargets.ts';
  import {
    readBannerDismissals,
    writeBannerDismissals,
    type BannerDismissals,
  } from '#lib/banners/model/dismissal.ts';

  type PresentedBanner = ActiveBanner & { plainText: string };

  let banners: PresentedBanner[] = $state([]);
  let pathname = $state('/');
  let refreshRevision = 0;
  let destroyed = false;
  const announcer = createAnnouncer({ repeat: true });
  const announced: Record<string, string | undefined> = Object.create(null);
  let fallbackText = $state('');
  let container: HTMLDivElement;
  let dismissalFallback: HTMLParagraphElement;

  let dismissals: BannerDismissals = $state(readBannerDismissals());

  // Public routes don't load the user profile, so audience filtering goes by token validity.
  const visibleBanners = $derived(
    banners.filter(
      (banner) =>
        matchesAudience(banner.audience) &&
        matchesBannerPageTargets(banner.pageTargets, pathname) &&
        !isDismissed(banner),
    ),
  );

  function matchesAudience(audience: BannerAudience): boolean {
    if (audience === 'SIGNED_IN') return session.hasValidToken;
    if (audience === 'SIGNED_OUT') return !session.hasValidToken;
    return true;
  }

  function isDismissed(banner: ActiveBanner): boolean {
    return banner.dismissible && dismissals[banner.uuid] === banner.presentationHash;
  }

  function untitledName(banner: PresentedBanner): string {
    return `Site announcement ${banners.indexOf(banner) + 1}`;
  }

  function announcementName(banner: PresentedBanner): string {
    return truncate(banner.title || banner.plainText || untitledName(banner), BANNER_LABEL_LENGTH);
  }

  $effect(() => {
    const newlyVisible = visibleBanners.filter(
      (banner) => announced[banner.uuid] !== banner.presentationHash,
    );
    if (newlyVisible.length === 0) {
      announcer.cancel();
      return;
    }
    const names = newlyVisible.slice(0, 2).map((banner) => announcementName(banner));
    const message = `${newlyVisible.length} new or updated site ${newlyVisible.length === 1 ? 'announcement' : 'announcements'}. ${names.join('. ')}${newlyVisible.length > 2 ? `. And ${newlyVisible.length - 2} more.` : ''}`;
    void announcer.announce(message).then((shown) => {
      if (shown)
        for (const banner of newlyVisible) announced[banner.uuid] = banner.presentationHash;
    });
  });

  async function dismissBanner(banner: ActiveBanner, event: MouseEvent): Promise<void> {
    const dismissedButton = event.currentTarget as HTMLButtonElement;
    const restoreFocus = event.detail === 0 && document.activeElement === dismissedButton;
    const revision = refreshRevision;
    const canRestoreFocus = () =>
      restoreFocus &&
      !destroyed &&
      revision === refreshRevision &&
      (document.activeElement === document.body || document.activeElement === dismissedButton);
    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-banner-dismiss]'),
    );
    const index = buttons.indexOf(dismissedButton);
    const nextButton = buttons[index + 1] ?? buttons[index - 1];
    dismissals = { ...dismissals, [banner.uuid]: banner.presentationHash };
    writeBannerDismissals(dismissals);
    await tick();
    if (canRestoreFocus()) {
      if (nextButton?.isConnected) nextButton.focus();
      else {
        fallbackText = 'End of site announcements.';
        await tick();
        if (canRestoreFocus()) dismissalFallback.focus();
        else fallbackText = '';
      }
    }
  }

  async function refreshBanners(currentPathname: string, pageLoad: boolean): Promise<void> {
    fallbackText = '';
    pathname = currentPathname;
    const revision = ++refreshRevision;
    try {
      const feed = await getActiveBanners();
      if (revision !== refreshRevision) return;
      const parsed = parseBannerFeed(feed);
      banners = parsed.banners.map((banner) => ({
        ...banner,
        plainText: bannerPlainText(banner.htmlContent),
      }));

      if (pageLoad) {
        for (const banner of visibleBanners) announced[banner.uuid] = banner.presentationHash;
      }
      if (parsed.malformed > 0) {
        log(
          createLog('ERROR', 'banner.feed_malformed_records', {
            malformedRecords: parsed.malformed,
          }),
        );
      }
    } catch (error) {
      if (revision !== refreshRevision) return;
      banners = [];
      log(
        createLog('ERROR', 'banner.feed_failed', undefined, {
          error: { message: error instanceof Error ? error.message : String(error) },
        }),
      );
    }
  }

  onDestroy(() => {
    destroyed = true;
    refreshRevision += 1;
  });

  afterNavigate((navigation) =>
    refreshBanners(
      navigation?.to?.url.pathname ?? window.location.pathname,
      navigation?.type === 'enter',
    ),
  );
</script>

<div class="w-full flex-none" bind:this={container}>
  <LiveRegion message={announcer.message} />
  {#if visibleBanners.length > 0}
    <div class="w-full flex-none" data-testid="banner-region">
      {#each visibleBanners as banner (banner.uuid)}
        <SiteBanner
          {banner}
          untitledName={untitledName(banner)}
          ondismiss={(event) => dismissBanner(banner, event)}
        />
      {/each}
    </div>
  {/if}
  <p class="sr-only" tabindex="-1" bind:this={dismissalFallback} onblur={() => (fallbackText = '')}>
    {fallbackText}
  </p>
</div>

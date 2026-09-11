<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { onDestroy, tick } from 'svelte';
  import { bannerPlainText } from '$lib/utilities/BannerHTML';
  import { truncate } from '$lib/utilities/Strings';
  import { createLog, log } from '$lib/logger';
  import type { ActiveBanner, BannerAudience } from '$lib/models/Banner';
  import {
    BANNER_APPEARANCES,
    BANNER_AUDIENCES,
    BANNER_ICONS,
    BANNER_LABEL_LENGTH,
  } from '$lib/models/Banner';
  import { Picsure } from '$lib/paths';
  import { hasValidToken } from '$lib/stores/User';
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import {
    matchesBannerPageTargets,
    parseBannerPageTargets,
  } from '$lib/utilities/BannerPageTargets';
  import {
    readBannerDismissals,
    writeBannerDismissals,
    type BannerDismissals,
  } from '$lib/utilities/BannerDismissal';

  const appearances = new Set<unknown>(BANNER_APPEARANCES);
  const icons = new Set<unknown>(BANNER_ICONS);
  const audiences = new Set<unknown>(BANNER_AUDIENCES);

  type BannerFeedRecord = Omit<ActiveBanner, 'placement'> & { placement: string };

  type PresentedBanner = ActiveBanner & { plainText: string };

  let banners: PresentedBanner[] = $state([]);
  let pathname = $state('/');
  let refreshRevision = 0;
  let destroyed = false;
  let announcement = $state('');
  let announcementRevision = 0;
  const announced: Record<string, string | undefined> = Object.create(null);
  let fallbackText = $state('');
  let container: HTMLDivElement;
  let dismissalFallback: HTMLParagraphElement;

  let dismissals: BannerDismissals = $state(readBannerDismissals());

  // Public routes do not hydrate the user store, so use token validity for audience filtering.
  const visibleBanners = $derived(
    banners.filter(
      (banner) =>
        matchesAudience(banner.audience) &&
        matchesBannerPageTargets(banner.pageTargets, pathname) &&
        !isDismissed(banner),
    ),
  );

  function matchesAudience(audience: BannerAudience): boolean {
    if (audience === 'SIGNED_IN') return $hasValidToken;
    if (audience === 'SIGNED_OUT') return !$hasValidToken;
    return true;
  }

  function isDismissed(banner: ActiveBanner): boolean {
    return banner.dismissible && dismissals[banner.uuid] === banner.presentationHash;
  }

  function bannerName(banner: PresentedBanner): string {
    return banner.title
      ? truncate(banner.title, BANNER_LABEL_LENGTH)
      : truncate(
          `Site announcement ${banners.indexOf(banner) + 1}${banner.plainText ? `: ${banner.plainText}` : ''}`,
          BANNER_LABEL_LENGTH,
        );
  }

  $effect(() => {
    const revision = ++announcementRevision;
    const newlyVisible = visibleBanners.filter(
      (banner) => announced[banner.uuid] !== banner.presentationHash,
    );
    if (newlyVisible.length === 0) return;
    const names = newlyVisible.slice(0, 2).map((banner) => bannerName(banner));
    const message = `${newlyVisible.length} new or updated site ${newlyVisible.length === 1 ? 'announcement' : 'announcements'}. ${names.join('. ')}${newlyVisible.length > 2 ? '. See site announcements for more.' : ''}`;
    announcement = '';
    void tick().then(() => {
      if (!destroyed && revision === announcementRevision) {
        announcement = message;
        for (const banner of newlyVisible) announced[banner.uuid] = banner.presentationHash;
      }
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

  function normalizeBannerFeedRecord(value: unknown): BannerFeedRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const banner = value as Record<string, unknown>;
    const pageTargets = parseBannerPageTargets(banner.pageTargets);

    if (
      typeof banner.uuid === 'string' &&
      typeof banner.htmlContent === 'string' &&
      (banner.title === null || typeof banner.title === 'string') &&
      appearances.has(banner.appearance) &&
      icons.has(banner.icon) &&
      typeof banner.dismissible === 'boolean' &&
      audiences.has(banner.audience) &&
      typeof banner.placement === 'string' &&
      pageTargets !== null &&
      typeof banner.priority === 'number' &&
      Number.isFinite(banner.priority) &&
      typeof banner.presentationHash === 'string'
    ) {
      return { ...banner, pageTargets } as BannerFeedRecord;
    }
    return null;
  }

  async function refreshBanners(currentPathname: string): Promise<void> {
    fallbackText = '';
    pathname = currentPathname;
    const revision = ++refreshRevision;
    try {
      // Deliberately bypasses $lib/api: the feed renders on the public login layout, where
      // api.ts would throw SvelteKit error() on a feed failure, log the visitor out on a
      // 401/403, and cannot express cache: 'no-store'. Failures degrade to no banners below.
      const response = await fetch(`/${Picsure.Banners.Active}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Banner feed returned HTTP ${response.status}`);

      const feed: unknown = await response.json();
      if (revision !== refreshRevision) return;
      if (!Array.isArray(feed)) throw new Error('Banner feed returned an invalid response');

      const validRecords = feed.map(normalizeBannerFeedRecord).filter((record) => record !== null);
      banners = validRecords
        .filter((banner): banner is ActiveBanner => banner.placement === 'SITE_TOP')
        .map((banner) => ({ ...banner, plainText: bannerPlainText(banner.htmlContent) }));
      const malformedRecords = feed.length - validRecords.length;
      if (malformedRecords > 0) {
        log(
          createLog('ERROR', 'banner.feed_malformed_records', {
            malformedRecords,
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
    refreshBanners(navigation?.to?.url.pathname ?? window.location.pathname),
  );
</script>

<div class="w-full flex-none" bind:this={container}>
  <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  {#if visibleBanners.length > 0}
    <section
      class="w-full flex-none"
      aria-label="Site announcements"
      data-testid="site-banner-region"
    >
      {#each visibleBanners as banner (banner.uuid)}
        <SiteBanner
          {banner}
          accessibleName={bannerName(banner)}
          ondismiss={(event) => dismissBanner(banner, event)}
        />
      {/each}
    </section>
  {/if}
  <p class="sr-only" tabindex="-1" bind:this={dismissalFallback} onblur={() => (fallbackText = '')}>
    {fallbackText}
  </p>
</div>

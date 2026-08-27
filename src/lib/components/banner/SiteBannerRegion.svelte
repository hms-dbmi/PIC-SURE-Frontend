<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { createLog, log } from '$lib/logger';
  import type {
    ActiveBanner,
    BannerAppearance,
    BannerAudience,
    BannerIcon,
  } from '$lib/models/Banner';
  import { Picsure } from '$lib/paths';
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';

  const appearances = new Set<BannerAppearance>(
    Object.keys({
      PRIMARY: true,
      SECONDARY: true,
      TERTIARY: true,
      SUCCESS: true,
      WARNING: true,
      ERROR: true,
      SURFACE: true,
    } satisfies Record<BannerAppearance, true>) as BannerAppearance[],
  );

  const icons = new Set<BannerIcon>(
    Object.keys({
      NONE: true,
      INFORMATION: true,
      SUCCESS: true,
      WARNING: true,
      ERROR: true,
    } satisfies Record<BannerIcon, true>) as BannerIcon[],
  );

  const audiences = new Set<BannerAudience>(
    Object.keys({
      EVERYONE: true,
      SIGNED_IN: true,
      SIGNED_OUT: true,
    } satisfies Record<BannerAudience, true>) as BannerAudience[],
  );

  type BannerFeedRecord = Omit<ActiveBanner, 'placement'> & { placement: string };

  let banners: ActiveBanner[] = $state([]);

  function isBannerFeedRecord(value: unknown): value is BannerFeedRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const banner = value as Record<string, unknown>;

    return (
      typeof banner.uuid === 'string' &&
      typeof banner.htmlContent === 'string' &&
      (banner.title === null || typeof banner.title === 'string') &&
      typeof banner.appearance === 'string' &&
      appearances.has(banner.appearance as BannerAppearance) &&
      typeof banner.icon === 'string' &&
      icons.has(banner.icon as BannerIcon) &&
      typeof banner.dismissible === 'boolean' &&
      audiences.has(banner.audience as BannerAudience) &&
      typeof banner.placement === 'string' &&
      Array.isArray(banner.pageTargets) &&
      typeof banner.priority === 'number' &&
      Number.isFinite(banner.priority) &&
      typeof banner.presentationHash === 'string'
    );
  }

  async function refreshBanners(): Promise<void> {
    try {
      const response = await fetch(`/${Picsure.Banners.Active}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Banner feed returned HTTP ${response.status}`);

      const feed: unknown = await response.json();
      if (!Array.isArray(feed)) throw new Error('Banner feed returned an invalid response');

      const validRecords = feed.filter(isBannerFeedRecord);
      banners = validRecords.filter(
        (banner): banner is ActiveBanner => banner.placement === 'SITE_TOP',
      );
      const malformedRecords = feed.length - validRecords.length;
      if (malformedRecords > 0) {
        log(
          createLog('ERROR', 'banner.feed_malformed_records', {
            malformedRecords,
          }),
        );
      }
    } catch (error) {
      banners = [];
      log(
        createLog('ERROR', 'banner.feed_failed', undefined, {
          error: { message: error instanceof Error ? error.message : String(error) },
        }),
      );
    }
  }

  afterNavigate(refreshBanners);
</script>

{#if banners.length > 0}
  <div class="w-full flex-none" data-testid="site-banner-region">
    {#each banners as banner (banner.uuid)}
      <SiteBanner {banner} />
    {/each}
  </div>
{/if}

<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { createLog, log } from '$lib/logger';
  import type { ActiveBanner, BannerAudience } from '$lib/models/Banner';
  import { BANNER_APPEARANCES, BANNER_AUDIENCES, BANNER_ICONS } from '$lib/models/Banner';
  import { Picsure } from '$lib/paths';
  import { hasValidToken } from '$lib/stores/User';
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import { isBannerPageTargets, matchesBannerPageTargets } from '$lib/utilities/BannerPageTargets';

  const appearances = new Set<unknown>(BANNER_APPEARANCES);
  const icons = new Set<unknown>(BANNER_ICONS);
  const audiences = new Set<unknown>(BANNER_AUDIENCES);

  type BannerFeedRecord = Omit<ActiveBanner, 'placement'> & { placement: string };

  let banners: ActiveBanner[] = $state([]);
  let pathname = $state('/');

  // Public routes do not hydrate the user store, so use token validity for audience filtering.
  const visibleBanners = $derived(
    banners.filter(
      (banner) =>
        matchesAudience(banner.audience) && matchesBannerPageTargets(banner.pageTargets, pathname),
    ),
  );

  function matchesAudience(audience: BannerAudience): boolean {
    if (audience === 'SIGNED_IN') return $hasValidToken;
    if (audience === 'SIGNED_OUT') return !$hasValidToken;
    return true;
  }

  function isBannerFeedRecord(value: unknown): value is BannerFeedRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const banner = value as Record<string, unknown>;

    return (
      typeof banner.uuid === 'string' &&
      typeof banner.htmlContent === 'string' &&
      (banner.title === null || typeof banner.title === 'string') &&
      appearances.has(banner.appearance) &&
      icons.has(banner.icon) &&
      typeof banner.dismissible === 'boolean' &&
      audiences.has(banner.audience) &&
      typeof banner.placement === 'string' &&
      isBannerPageTargets(banner.pageTargets) &&
      typeof banner.priority === 'number' &&
      Number.isFinite(banner.priority) &&
      typeof banner.presentationHash === 'string'
    );
  }

  async function refreshBanners(currentPathname: string): Promise<void> {
    pathname = currentPathname;
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

  afterNavigate((navigation) =>
    refreshBanners(navigation?.to?.url.pathname ?? window.location.pathname),
  );
</script>

{#if visibleBanners.length > 0}
  <div class="w-full flex-none" data-testid="site-banner-region">
    {#each visibleBanners as banner (banner.uuid)}
      <SiteBanner {banner} />
    {/each}
  </div>
{/if}

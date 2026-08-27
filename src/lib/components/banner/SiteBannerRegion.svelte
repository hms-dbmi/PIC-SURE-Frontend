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
  import { sanitizeHTML } from '$lib/utilities/HTML';

  const toneClasses: Record<BannerAppearance, string> = {
    PRIMARY: 'preset-tonal-primary border-primary-500',
    SECONDARY: 'preset-tonal-secondary border-secondary-500',
    TERTIARY: 'preset-tonal-tertiary border-tertiary-500',
    SUCCESS: 'preset-tonal-success border-success-500',
    WARNING: 'preset-tonal-warning border-warning-500',
    ERROR: 'preset-tonal-error border-error-500',
    SURFACE: 'preset-tonal-surface border-surface-500',
  };

  const iconClasses: Record<BannerIcon, string | undefined> = {
    NONE: undefined,
    INFORMATION: 'fa-circle-info',
    SUCCESS: 'fa-circle-check',
    WARNING: 'fa-triangle-exclamation',
    ERROR: 'fa-circle-exclamation',
  };

  const appearances = new Set<BannerAppearance>(Object.keys(toneClasses) as BannerAppearance[]);
  const icons = new Set<BannerIcon>(Object.keys(iconClasses) as BannerIcon[]);
  const audiences: Record<BannerAudience, true> = {
    EVERYONE: true,
    SIGNED_IN: true,
    SIGNED_OUT: true,
  };

  let banners: ActiveBanner[] = $state([]);

  function isActiveBanner(value: unknown): value is ActiveBanner {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const banner = value as Record<string, unknown>;

    return (
      typeof banner.uuid === 'string' &&
      typeof banner.htmlContent === 'string' &&
      (banner.title === null || typeof banner.title === 'string') &&
      appearances.has(banner.appearance as BannerAppearance) &&
      icons.has(banner.icon as BannerIcon) &&
      typeof banner.dismissible === 'boolean' &&
      audiences[banner.audience as BannerAudience] === true &&
      banner.placement === 'SITE_TOP' &&
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

      banners = feed.filter(isActiveBanner);
      const skippedRecords = feed.length - banners.length;
      if (skippedRecords > 0) {
        log(
          createLog('ERROR', 'banner.feed_records_skipped', {
            skipped_records: skippedRecords,
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
      <section
        aria-label={banner.title || 'Site announcement'}
        data-testid="site-banner"
        class="w-full border-l-8 px-4 py-3 {toneClasses[banner.appearance]}"
      >
        <div class="mx-auto flex w-full items-start gap-3">
          {#if iconClasses[banner.icon]}
            <i class="fa-solid {iconClasses[banner.icon]} mt-1 flex-none text-xl" aria-hidden="true"
            ></i>
          {/if}
          <div class="min-w-0">
            {#if banner.title}<h2 class="h4 mb-1">{banner.title}</h2>{/if}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <div class="site-banner-content">{@html sanitizeHTML(banner.htmlContent)}</div>
          </div>
        </div>
      </section>
    {/each}
  </div>
{/if}

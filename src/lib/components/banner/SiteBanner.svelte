<script lang="ts">
  import type { BannerAppearance, BannerIcon, BannerPresentation } from '$lib/models/Banner';
  import { sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

  let {
    banner,
    ondismiss,
    titleLevel = 2,
  }: {
    banner: BannerPresentation;
    ondismiss?: () => void;
    titleLevel?: 2 | 3;
  } = $props();

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

  const dismissLabel = $derived(`Dismiss ${banner.title || 'site announcement'}`);
</script>

<section
  aria-label={banner.title || 'Site announcement'}
  data-testid="site-banner"
  class="w-full border-l-8 px-4 py-3 {toneClasses[banner.appearance]}"
>
  <div class="mx-auto flex w-full items-start gap-3">
    {#if iconClasses[banner.icon]}
      <i class="fa-solid {iconClasses[banner.icon]} mt-1 flex-none text-xl" aria-hidden="true"></i>
    {/if}
    <div class="min-w-0 flex-1">
      {#if banner.title}
        {#if titleLevel === 3}
          <h3 class="h4 mb-1">{banner.title}</h3>
        {:else}
          <h2 class="h4 mb-1">{banner.title}</h2>
        {/if}
      {/if}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="site-banner-content">{@html sanitizeBannerHTML(banner.htmlContent)}</div>
    </div>
    {#if banner.dismissible && ondismiss}
      <button
        type="button"
        class="site-banner-dismiss btn-icon h-11 w-11 flex-none rounded-full border border-current focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label={dismissLabel}
        title={dismissLabel}
        onclick={ondismiss}
      >
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    {/if}
  </div>
</section>

<style>
  .site-banner-dismiss {
    box-sizing: border-box;
    padding: 0;
  }

  .site-banner-content {
    white-space: pre-wrap;
  }

  .site-banner-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .site-banner-content :global(ul) {
    list-style: disc;
  }

  .site-banner-content :global(ol) {
    list-style: decimal;
  }

  .site-banner-content :global(ul),
  .site-banner-content :global(ol) {
    margin-left: 1.5rem;
  }

  .site-banner-content :global(a) {
    color: inherit;
    font-weight: 650;
    text-decoration: underline;
  }
</style>

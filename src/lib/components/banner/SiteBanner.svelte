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
  class="w-full border-b-4 px-4 py-1.5 {toneClasses[banner.appearance]}"
>
  <div class="site-banner-layout mx-auto flex w-full items-center gap-3">
    {#if iconClasses[banner.icon]}
      <i
        class="site-banner-icon fa-solid {iconClasses[banner.icon]} flex-none text-lg"
        aria-hidden="true"
      ></i>
    {/if}
    <div class="min-w-0 flex-1">
      {#if banner.title}
        {#if titleLevel === 3}
          <h3 class="site-banner-title">{banner.title}</h3>
        {:else}
          <h2 class="site-banner-title">{banner.title}</h2>
        {/if}
      {/if}
      <div class="site-banner-content text-sm leading-5">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sanitizeBannerHTML(banner.htmlContent)}
      </div>
    </div>
    {#if banner.dismissible && ondismiss}
      <button
        type="button"
        class="site-banner-dismiss flex h-11 w-11 flex-none items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label={dismissLabel}
        title={dismissLabel}
        onclick={ondismiss}
      >
        <span
          class="site-banner-dismiss-visual flex h-8 w-8 items-center justify-center rounded-full border border-current"
          aria-hidden="true"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </span>
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

  .site-banner-content :global(p) {
    margin: 0;
  }

  .site-banner-title {
    margin: 0 0 0.125rem;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25rem;
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

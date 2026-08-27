<script lang="ts">
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import Editor from '$lib/components/editor/Editor.svelte';
  import type {
    BannerAppearance,
    BannerDraft,
    BannerIcon,
    BannerPresentation,
    PublishedBanner,
  } from '$lib/models/Banner';
  import { BANNER_APPEARANCES, BANNER_ICONS } from '$lib/models/Banner';
  import { publishBanner } from '$lib/services/BannerManagement';
  import { toaster } from '$lib/toaster';
  import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

  const appearanceDetails: Record<BannerAppearance, { label: string; swatchClass: string }> = {
    PRIMARY: { label: 'Primary', swatchClass: 'bg-primary-500' },
    SECONDARY: { label: 'Secondary', swatchClass: 'bg-secondary-500' },
    TERTIARY: { label: 'Tertiary', swatchClass: 'bg-tertiary-500' },
    SUCCESS: { label: 'Success', swatchClass: 'bg-success-500' },
    WARNING: { label: 'Warning', swatchClass: 'bg-warning-500' },
    ERROR: { label: 'Error', swatchClass: 'bg-error-500' },
    SURFACE: { label: 'Surface', swatchClass: 'bg-surface-500' },
  };
  const appearanceOptions = BANNER_APPEARANCES.map((value) => ({
    value,
    ...appearanceDetails[value],
  }));

  const iconLabels: Record<BannerIcon, string> = {
    NONE: 'None',
    INFORMATION: 'Information',
    SUCCESS: 'Success',
    WARNING: 'Warning',
    ERROR: 'Error',
  };
  const iconOptions = BANNER_ICONS.map((value) => ({ value, label: iconLabels[value] }));

  let htmlContent = $state('');
  let title = $state('');
  let appearance: BannerAppearance = $state('PRIMARY');
  let icon: BannerIcon = $state('NONE');
  let dismissible = $state(true);
  let publishing = $state(false);
  let publishedBanner: PublishedBanner | null = $state(null);

  const sanitizedLength = $derived(sanitizeBannerHTML(htmlContent).length);
  const hasContent = $derived(hasBannerContent(htmlContent));
  const preview: BannerPresentation = $derived({
    htmlContent,
    title: title.trim() || null,
    appearance,
    icon,
    dismissible,
  });

  async function publish() {
    const draft: BannerDraft = {
      ...preview,
      title,
      audience: 'EVERYONE',
      placement: 'SITE_TOP',
      pageTargets: [{ kind: 'ALL' }],
    };
    publishing = true;
    try {
      publishedBanner = await publishBanner(draft);
      htmlContent = publishedBanner.htmlContent;
      title = publishedBanner.title ?? '';
      appearance = publishedBanner.appearance;
      icon = publishedBanner.icon;
      dismissible = publishedBanner.dismissible;
      toaster.success({ title: 'Banner published' });
    } catch {
      toaster.error({
        title: 'Banner could not be published',
        description: 'The banner was not published. Check your connection and try again.',
      });
    } finally {
      publishing = false;
    }
  }
</script>

<section class="mx-auto max-w-5xl" aria-labelledby="create-banner-title">
  <header class="mb-6">
    <h2 id="create-banner-title">Create banner</h2>
    <p>Publish an announcement across PIC-SURE. Published banners cannot be edited yet.</p>
  </header>

  <form
    data-testid="banner-editor-form"
    class="card border border-surface-300 p-6"
    onsubmit={(event) => {
      event.preventDefault();
      publish();
    }}
  >
    <div class="grid gap-6">
      <div>
        <span class="font-bold">Banner content</span>
        <div class="mt-2">
          <Editor
            id="banner-content-editor"
            basicToolbar
            sanitizer={sanitizeBannerHTML}
            ariaLabel="Banner content"
            bind:content={htmlContent}
          />
        </div>
        <p class="mt-1 text-sm text-surface-600">
          Basic formatting, lists, relative links, HTTPS links, and email links are supported.
          {sanitizedLength}/5,000 characters
        </p>
      </div>

      <fieldset>
        <legend class="font-bold">Appearance</legend>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {#each appearanceOptions as option}
            <label
              class="flex cursor-pointer items-center gap-2 rounded border border-surface-300 px-3 py-2"
            >
              <input type="radio" name="appearance" value={option.value} bind:group={appearance} />
              <span
                data-testid="appearance-swatch"
                class="h-3 w-3 rounded-full {option.swatchClass}"
                aria-hidden="true"
              ></span>
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend class="font-bold">Dismissal</legend>
        <div class="mt-2 flex gap-6">
          <label class="flex items-center gap-2">
            <input type="radio" name="dismissal" value={true} bind:group={dismissible} />
            Dismissible
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" name="dismissal" value={false} bind:group={dismissible} />
            Permanent
          </label>
        </div>
      </fieldset>

      <section
        class="rounded border border-dashed border-surface-500 bg-surface-100 p-4"
        aria-labelledby="banner-preview-title"
      >
        <h3 id="banner-preview-title" class="mb-3">Banner preview</h3>
        <SiteBanner banner={preview} ondismiss={() => {}} />
      </section>

      <details class="rounded border border-surface-300 p-4">
        <summary class="font-bold">Advanced options</summary>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="grid gap-1">
            <span class="font-bold">Title</span>
            <input class="input" type="text" maxlength="120" bind:value={title} />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">Icon</span>
            <select class="select" bind:value={icon}>
              {#each iconOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </label>
        </div>
      </details>
    </div>

    <div class="mt-6 flex justify-end">
      <button
        type="submit"
        class="btn preset-filled-primary-500"
        disabled={publishing || !hasContent || sanitizedLength > 5_000}
      >
        {publishing ? 'Publishing...' : 'Publish now'}
      </button>
    </div>
  </form>
</section>

<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import Editor from '$lib/components/editor/Editor.svelte';
  import type {
    BannerAppearance,
    BannerDraft,
    BannerIcon,
    BannerPresentation,
  } from '$lib/models/Banner';
  import { publishBanner } from '$lib/services/BannerManagement';
  import { toaster } from '$lib/toaster';
  import { sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

  const appearanceOptions = [
    { value: 'PRIMARY', label: 'Primary' },
    { value: 'SECONDARY', label: 'Secondary' },
    { value: 'TERTIARY', label: 'Tertiary' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'ERROR', label: 'Error' },
    { value: 'SURFACE', label: 'Surface' },
  ] satisfies { value: BannerAppearance; label: string }[];

  const iconOptions = [
    { value: 'NONE', label: 'None' },
    { value: 'INFORMATION', label: 'Information' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'ERROR', label: 'Error' },
  ] satisfies { value: BannerIcon; label: string }[];

  let htmlContent = $state('');
  let title = $state('');
  let appearance: BannerAppearance = $state('PRIMARY');
  let icon: BannerIcon = $state('NONE');
  let dismissible = $state(true);
  let publishing = $state(false);

  const sanitizedLength = $derived(sanitizeBannerHTML(htmlContent).length);
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
      const published = await publishBanner(draft);
      htmlContent = published.htmlContent;
      title = published.title ?? '';
      appearance = published.appearance;
      icon = published.icon;
      dismissible = published.dismissible;
      toaster.success({ title: 'Banner published' });
      await goto(resolve('/'));
    } catch (error) {
      toaster.error({
        title: 'Banner could not be published',
        description: error instanceof Error ? error.message : String(error),
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
    class="card border border-surface-300 p-6"
    onsubmit={(event) => {
      event.preventDefault();
      publish();
    }}
  >
    <div class="grid gap-6">
      <div>
        <label class="font-bold" for="banner-editor">Banner content</label>
        <div id="banner-editor" class="mt-2">
          <Editor
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
                class="h-3 w-3 rounded-full bg-{option.value.toLowerCase()}-500"
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
        disabled={publishing || sanitizedLength === 0 || sanitizedLength > 5_000}
      >
        {publishing ? 'Publishing...' : 'Publish now'}
      </button>
    </div>
  </form>
</section>

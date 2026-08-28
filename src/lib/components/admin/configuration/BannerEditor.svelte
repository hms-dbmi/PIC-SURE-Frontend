<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onDestroy, untrack } from 'svelte';
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import Editor from '$lib/components/editor/Editor.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type {
    BannerAppearance,
    BannerDraft,
    BannerIcon,
    BannerPresentation,
    ManagedBanner,
  } from '$lib/models/Banner';
  import { BANNER_APPEARANCES, BANNER_APPEARANCE_DETAILS, BANNER_ICONS } from '$lib/models/Banner';
  import {
    publishBanner,
    publishSavedBanner,
    saveBanner,
    updateSavedBanner,
  } from '$lib/services/BannerManagement';
  import { toaster } from '$lib/toaster';
  import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

  interface Props {
    banner?: ManagedBanner | null;
    onsuccess?: (banner: ManagedBanner) => void;
    oncancel?: () => void;
    ondirtychange?: (dirty: boolean) => void;
  }

  let {
    banner = null,
    onsuccess = () => {},
    oncancel = () => {},
    ondirtychange = () => {},
  }: Props = $props();
  const appearanceOptions = BANNER_APPEARANCES.map((value) => ({
    value,
    ...BANNER_APPEARANCE_DETAILS[value],
  }));
  const iconLabels: Record<BannerIcon, string> = {
    NONE: 'None',
    INFORMATION: 'Information',
    SUCCESS: 'Success',
    WARNING: 'Warning',
    ERROR: 'Error',
  };
  const iconOptions = BANNER_ICONS.map((value) => ({ value, label: iconLabels[value] }));

  let htmlContent = $state(untrack(() => banner?.htmlContent ?? ''));
  let title = $state(untrack(() => banner?.title ?? ''));
  let appearance: BannerAppearance = $state(untrack(() => banner?.appearance ?? 'PRIMARY'));
  let icon: BannerIcon = $state(untrack(() => banner?.icon ?? 'NONE'));
  let dismissible = $state(untrack(() => banner?.dismissible ?? true));
  let working: 'save' | 'publish' | null = $state(null);
  let showUnsavedModal = $state(false);
  let pendingUrl: URL | null = null;
  let pendingCancel = false;
  let bypassGuard = false;

  const sanitizedLength = $derived(sanitizeBannerHTML(htmlContent).length);
  const hasContent = $derived(hasBannerContent(htmlContent));
  const preview: BannerPresentation = $derived({
    htmlContent,
    title: title.trim() || null,
    appearance,
    icon,
    dismissible,
  });

  function draft(): BannerDraft {
    return {
      ...preview,
      title,
      audience: banner?.audience ?? 'EVERYONE',
      placement: banner?.placement ?? 'SITE_TOP',
      pageTargets: banner?.pageTargets ?? [{ kind: 'ALL' }],
    };
  }

  function snapshot() {
    const value = draft();
    return JSON.stringify({ ...value, htmlContent: sanitizeBannerHTML(value.htmlContent) });
  }

  let initialSnapshot = $state(snapshot());
  const dirty = $derived(snapshot() !== initialSnapshot);

  $effect(() => {
    ondirtychange(dirty);
  });

  onDestroy(() => ondirtychange(false));

  beforeNavigate(({ to, cancel, willUnload }) => {
    if (!bypassGuard && dirty && !willUnload) {
      cancel();
      pendingUrl = to?.url ?? null;
      pendingCancel = false;
      showUnsavedModal = true;
    }
  });

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (dirty) event.preventDefault();
  }

  function requestCancel() {
    if (dirty) {
      pendingCancel = true;
      pendingUrl = null;
      showUnsavedModal = true;
      return;
    }
    oncancel();
  }

  function keepEditing() {
    showUnsavedModal = false;
    pendingCancel = false;
    pendingUrl = null;
  }

  async function discardChanges() {
    showUnsavedModal = false;
    if (pendingCancel) {
      oncancel();
    } else if (pendingUrl) {
      bypassGuard = true;
      try {
        await goto(resolve(`${pendingUrl.pathname}${pendingUrl.search}${pendingUrl.hash}` as '/'));
      } finally {
        bypassGuard = false;
      }
    }
  }

  async function saveForLater() {
    if (working) return;
    working = 'save';
    try {
      const saved = banner
        ? await updateSavedBanner(banner.uuid, draft())
        : await saveBanner(draft());
      initialSnapshot = snapshot();
      toaster.success({ title: banner ? 'Banner changes saved' : 'Banner saved for later' });
      onsuccess(saved);
    } catch {
      toaster.error({
        title: 'Banner could not be saved',
        description: 'Your changes are still here. Check your connection and try again.',
      });
    } finally {
      working = null;
    }
  }

  async function publish() {
    if (working) return;
    working = 'publish';
    try {
      const published = banner
        ? await publishSavedBanner(banner.uuid, draft())
        : await publishBanner(draft());
      initialSnapshot = snapshot();
      toaster.success({ title: 'Banner published' });
      onsuccess(published);
    } catch {
      toaster.error({
        title: 'Banner could not be published',
        description: 'The banner was not published. Check your connection and try again.',
      });
    } finally {
      working = null;
    }
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<Modal bind:open={showUnsavedModal} title="Unsaved Changes" closeable onclose={keepEditing}>
  <p class="mb-6">You have unsaved banner changes. Discard them or keep editing.</p>
  <footer class="flex justify-end gap-2">
    <button type="button" class="btn border preset-tonal-primary" onclick={keepEditing}>
      Keep editing
    </button>
    <button type="button" class="btn preset-filled-error-500" onclick={discardChanges}>
      Discard changes
    </button>
  </footer>
</Modal>

<section class="mx-auto max-w-5xl" aria-labelledby="banner-editor-title">
  <header class="mb-6">
    <h2 id="banner-editor-title">{banner ? 'Edit saved banner' : 'Create banner'}</h2>
    <p>
      {banner
        ? 'Update this reusable draft or publish it across PIC-SURE.'
        : 'Save this announcement for later or publish it across PIC-SURE.'}
    </p>
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
            convertQuillClasses={false}
            reconcileSanitizedDocument
            normalizeNonBreakingSpaces
            ariaLabel="Banner content"
            ariaDescribedBy="banner-content-help"
            bind:content={htmlContent}
          />
        </div>
        <div id="banner-content-help" class="text-sm text-surface-600">
          <p class="mt-1">
            Basic formatting, lists, relative links, HTTPS links, and email links are supported.
          </p>
          <p>
            {sanitizedLength}/5,000 sanitized HTML characters.
            {#if sanitizedLength > 5_000}
              <span class="text-error-700">
                Content exceeds the 5,000-character limit. Shorten it before publishing.
              </span>
            {/if}
          </p>
        </div>
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
        <SiteBanner banner={preview} titleLevel={3} />
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

    <div class="mt-6 flex items-center justify-end gap-3">
      <button type="button" class="btn preset-tonal-primary mr-auto" onclick={requestCancel}>
        Cancel
      </button>
      <button
        type="button"
        class="btn border preset-tonal-primary"
        disabled={working !== null || !dirty || !hasContent || sanitizedLength > 5_000}
        onclick={saveForLater}
      >
        {working === 'save' ? 'Saving...' : banner ? 'Save changes' : 'Save for later'}
      </button>
      <button
        type="submit"
        class="btn preset-filled-primary-500"
        disabled={working !== null || !hasContent || sanitizedLength > 5_000}
      >
        {working === 'publish' ? 'Publishing...' : 'Publish now'}
      </button>
    </div>
  </form>
</section>

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
    updatePublishedBanner,
    updateSavedBanner,
  } from '$lib/services/BannerManagement';
  import { toaster } from '$lib/toaster';
  import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';
  import {
    formatInstantAsLocalMinute,
    resolveLocalMinute,
    type LocalMinuteResolution,
  } from '$lib/utilities/BannerSchedule';

  interface Props {
    banner?: ManagedBanner | null;
    onsuccess?: (banner: ManagedBanner) => void;
    oncancel?: () => void;
    ondirtychange?: (dirty: boolean) => void;
    tabchangerequest?: string | null;
    ontabchangerequestresolve?: (destination: string | null) => void;
  }

  let {
    banner = null,
    onsuccess = () => {},
    oncancel = () => {},
    ondirtychange = () => {},
    tabchangerequest = null,
    ontabchangerequestresolve = () => {},
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
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let htmlContent = $state(untrack(() => banner?.htmlContent ?? ''));
  let title = $state(untrack(() => banner?.title ?? ''));
  let appearance: BannerAppearance = $state(untrack(() => banner?.appearance ?? 'PRIMARY'));
  let icon: BannerIcon = $state(untrack(() => banner?.icon ?? 'NONE'));
  let dismissible = $state(untrack(() => banner?.dismissible ?? true));
  let startLocal = $state(
    untrack(() => (banner?.startAt ? formatInstantAsLocalMinute(banner.startAt, timeZone) : '')),
  );
  let endLocal = $state(
    untrack(() => (banner?.endAt ? formatInstantAsLocalMinute(banner.endAt, timeZone) : '')),
  );
  let startChoice = $state(
    untrack(() => (banner?.startAt ? new Date(banner.startAt).toISOString() : '')),
  );
  let endChoice = $state(
    untrack(() => (banner?.endAt ? new Date(banner.endAt).toISOString() : '')),
  );
  let working: 'save' | 'publish' | null = $state(null);
  let showUnsavedModal = $state(false);
  let pendingUrl: URL | null = null;
  let pendingCancel = false;
  let pendingTabChange: string | null = $state(null);
  let bypassGuard = false;

  const sanitizedLength = $derived(sanitizeBannerHTML(htmlContent).length);
  const hasContent = $derived(hasBannerContent(htmlContent));
  const startResolution = $derived(startLocal ? resolveLocalMinute(startLocal, timeZone) : null);
  const endResolution = $derived(endLocal ? resolveLocalMinute(endLocal, timeZone) : null);
  const resolvedStart = $derived(selectedInstant(startResolution, startChoice));
  const resolvedEnd = $derived(selectedInstant(endResolution, endChoice));
  const scheduleInvalid = $derived(
    (startLocal !== '' && resolvedStart === null) ||
      (endLocal !== '' && resolvedEnd === null) ||
      (resolvedStart !== null && resolvedEnd !== null && resolvedEnd <= resolvedStart),
  );
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
      startAt: banner?.status === 'PUBLISHED' ? banner.startAt : resolvedStart,
      endAt: banner?.status === 'PUBLISHED' ? banner.endAt : resolvedEnd,
    };
  }

  function selectedInstant(resolution: LocalMinuteResolution | null, choice: string) {
    if (!resolution) return null;
    if (resolution.status === 'resolved') return resolution.options[0].instant;
    if (resolution.status === 'ambiguous') {
      return resolution.options.some((option) => option.instant === choice) ? choice : null;
    }
    return null;
  }

  function utcText(instant: string) {
    return `Resolved UTC: ${instant.slice(0, 16).replace('T', ' ')} UTC`;
  }

  function snapshot() {
    const value = draft();
    return JSON.stringify({
      ...value,
      htmlContent: sanitizeBannerHTML(value.htmlContent),
      scheduleInput: { startLocal, endLocal, startChoice, endChoice },
    });
  }

  let initialSnapshot = $state(snapshot());
  const dirty = $derived(snapshot() !== initialSnapshot);

  $effect(() => {
    ondirtychange(dirty);
  });

  $effect(() => {
    if (tabchangerequest) {
      pendingTabChange = tabchangerequest;
      pendingCancel = false;
      pendingUrl = null;
      showUnsavedModal = true;
    }
  });

  onDestroy(() => ondirtychange(false));

  beforeNavigate(({ to, cancel, willUnload }) => {
    if (!bypassGuard && dirty && !willUnload) {
      cancel();
      pendingUrl = to?.url ?? null;
      pendingCancel = false;
      pendingTabChange = null;
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
      pendingTabChange = null;
      showUnsavedModal = true;
      return;
    }
    oncancel();
  }

  function keepEditing() {
    const wasTabChange = pendingTabChange !== null || tabchangerequest !== null;
    showUnsavedModal = false;
    pendingCancel = false;
    pendingUrl = null;
    pendingTabChange = null;
    if (wasTabChange) ontabchangerequestresolve(null);
  }

  async function discardChanges() {
    const tabDestination = pendingTabChange ?? tabchangerequest;
    showUnsavedModal = false;
    pendingTabChange = null;
    if (tabDestination) {
      ontabchangerequestresolve(tabDestination);
    } else if (pendingCancel) {
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
      const published =
        banner?.status === 'PUBLISHED'
          ? await updatePublishedBanner(banner.uuid, draft())
          : banner
            ? await publishSavedBanner(banner.uuid, draft())
            : await publishBanner(draft());
      initialSnapshot = snapshot();
      toaster.success({
        title:
          banner?.status === 'PUBLISHED'
            ? 'Banner updated'
            : startLocal
              ? 'Banner scheduled'
              : 'Banner published',
      });
      onsuccess(published);
    } catch {
      if (banner?.status === 'PUBLISHED') {
        toaster.error({
          title: 'Banner could not be updated',
          description: 'The changes were not saved. Check your connection and try again.',
        });
      } else {
        toaster.error({
          title: startLocal ? 'Banner could not be scheduled' : 'Banner could not be published',
          description: startLocal
            ? 'The banner was not scheduled. Check your connection and try again.'
            : 'The banner was not published. Check your connection and try again.',
        });
      }
    } finally {
      working = null;
    }
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<Modal bind:open={showUnsavedModal} title="Unsaved Changes" closeable={false}>
  <p class="mb-6">
    {#if pendingTabChange ?? tabchangerequest}
      You have unsaved banner changes. Discard them to open {pendingTabChange ?? tabchangerequest},
      or keep editing.
    {:else}
      You have unsaved banner changes. Discard them or keep editing.
    {/if}
  </p>
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
    <h2 id="banner-editor-title">
      {banner?.status === 'PUBLISHED'
        ? 'Edit published banner'
        : banner
          ? 'Edit saved banner'
          : 'Create banner'}
    </h2>
    <p>
      {banner?.status === 'PUBLISHED'
        ? 'Correct the published announcement. Saved changes take effect immediately.'
        : banner
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

      {#if banner?.status !== 'PUBLISHED'}
        <fieldset>
          <legend class="font-bold">Schedule</legend>
          <p class="mt-1 text-sm text-surface-600">
            Times use your local timezone ({timeZone}) at minute precision. Leave Start blank to
            publish immediately using the server's current UTC time.
          </p>
          <div class="mt-3 grid gap-4 sm:grid-cols-2">
            <div class="grid content-start gap-1">
              <label class="font-bold" for="banner-start">Start</label>
              <input
                id="banner-start"
                class="input"
                type="datetime-local"
                step="60"
                bind:value={startLocal}
                aria-describedby="banner-start-help"
              />
              <div id="banner-start-help" class="text-sm text-surface-600">
                {#if !startLocal}
                  Server UTC when published.
                {:else if startResolution?.status === 'nonexistent'}
                  <span class="text-error-700">
                    This local time does not exist because the clock moves forward.
                  </span>
                {:else if startResolution?.status === 'invalid'}
                  <span class="text-error-700">Enter a valid local date and time.</span>
                {:else if resolvedStart}
                  {utcText(resolvedStart)}
                {/if}
              </div>
              {#if startResolution?.status === 'ambiguous'}
                <label class="mt-1 grid gap-1">
                  <span class="font-bold">Start UTC offset</span>
                  <select
                    class="select"
                    value={startChoice}
                    onchange={(event) => (startChoice = event.currentTarget.value)}
                  >
                    <option value="">Choose an offset</option>
                    {#each startResolution.options as option}
                      <option value={option.instant}>UTC{option.offset}</option>
                    {/each}
                  </select>
                </label>
              {/if}
            </div>
            <div class="grid content-start gap-1">
              <label class="font-bold" for="banner-end">End</label>
              <input
                id="banner-end"
                class="input"
                type="datetime-local"
                step="60"
                bind:value={endLocal}
                aria-describedby="banner-end-help"
              />
              <div id="banner-end-help" class="text-sm text-surface-600">
                {#if !endLocal}
                  No end date.
                {:else if endResolution?.status === 'nonexistent'}
                  <span class="text-error-700">
                    This local time does not exist because the clock moves forward.
                  </span>
                {:else if endResolution?.status === 'invalid'}
                  <span class="text-error-700">Enter a valid local date and time.</span>
                {:else if resolvedEnd}
                  {utcText(resolvedEnd)}
                {/if}
              </div>
              {#if endResolution?.status === 'ambiguous'}
                <label class="mt-1 grid gap-1">
                  <span class="font-bold">End UTC offset</span>
                  <select
                    class="select"
                    value={endChoice}
                    onchange={(event) => (endChoice = event.currentTarget.value)}
                  >
                    <option value="">Choose an offset</option>
                    {#each endResolution.options as option}
                      <option value={option.instant}>UTC{option.offset}</option>
                    {/each}
                  </select>
                </label>
              {/if}
            </div>
          </div>
          {#if resolvedStart && resolvedEnd && resolvedEnd <= resolvedStart}
            <p class="mt-2 text-sm text-error-700">End must be after start.</p>
          {/if}
        </fieldset>
      {/if}

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
      {#if banner?.status !== 'PUBLISHED'}
        <button
          type="button"
          class="btn border preset-tonal-primary"
          disabled={working !== null ||
            !dirty ||
            !hasContent ||
            sanitizedLength > 5_000 ||
            scheduleInvalid}
          onclick={saveForLater}
        >
          {working === 'save' ? 'Saving...' : banner ? 'Save changes' : 'Save for later'}
        </button>
      {/if}
      <button
        type="submit"
        class="btn preset-filled-primary-500"
        disabled={working !== null ||
          (banner?.status === 'PUBLISHED' && !dirty) ||
          !hasContent ||
          sanitizedLength > 5_000 ||
          scheduleInvalid}
      >
        {working === 'publish'
          ? banner?.status === 'PUBLISHED'
            ? 'Saving...'
            : startLocal
              ? 'Scheduling...'
              : 'Publishing...'
          : banner?.status === 'PUBLISHED'
            ? 'Save changes'
            : startLocal
              ? 'Schedule banner'
              : 'Publish now'}
      </button>
    </div>
  </form>
</section>

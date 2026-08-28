<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onDestroy, untrack } from 'svelte';
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import Editor from '$lib/components/editor/Editor.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type {
    BannerAppearance,
    BannerAudience,
    BannerDraft,
    BannerIcon,
    BannerPageTarget,
    BannerPresentation,
    ManagedBanner,
  } from '$lib/models/Banner';
  import {
    BANNER_APPEARANCES,
    BANNER_APPEARANCE_DETAILS,
    BANNER_AUDIENCES,
    BANNER_AUDIENCE_LABELS,
    BANNER_ICONS,
  } from '$lib/models/Banner';
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
  import { validateBannerPageTarget } from '$lib/utilities/BannerPageTargets';

  type TargetedPage = Exclude<BannerPageTarget, { kind: 'ALL' }>;

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
  const audienceOptions = BANNER_AUDIENCES.map((value) => ({
    value,
    label: BANNER_AUDIENCE_LABELS[value],
  }));
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const initialStartLocal = untrack(() =>
    banner?.startAt ? formatInstantAsLocalMinute(banner.startAt, timeZone) : '',
  );
  const initialEndLocal = untrack(() =>
    banner?.endAt ? formatInstantAsLocalMinute(banner.endAt, timeZone) : '',
  );
  const initialStartChoice = untrack(() =>
    banner?.startAt ? new Date(banner.startAt).toISOString() : '',
  );
  const initialEndChoice = untrack(() =>
    banner?.endAt ? new Date(banner.endAt).toISOString() : '',
  );
  const initialPageTargets = untrack(() => banner?.pageTargets ?? [{ kind: 'ALL' as const }]);

  let htmlContent = $state(untrack(() => banner?.htmlContent ?? ''));
  let title = $state(untrack(() => banner?.title ?? ''));
  let appearance: BannerAppearance = $state(untrack(() => banner?.appearance ?? 'PRIMARY'));
  let icon: BannerIcon = $state(untrack(() => banner?.icon ?? 'NONE'));
  let dismissible = $state(untrack(() => banner?.dismissible ?? true));
  let audience: BannerAudience = $state(untrack(() => banner?.audience ?? 'EVERYONE'));
  let allPages = $state(initialPageTargets.some((target) => target.kind === 'ALL'));
  let pageTargets: TargetedPage[] = $state(
    initialPageTargets
      .filter((target): target is TargetedPage => target.kind !== 'ALL')
      .map((target) => ({ ...target })),
  );
  let startLocal = $state(untrack(() => initialStartLocal));
  let endLocal = $state(untrack(() => initialEndLocal));
  let startChoice = $state(untrack(() => initialStartChoice));
  let endChoice = $state(untrack(() => initialEndChoice));
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
  const resolvedStart = $derived(
    selectedInstant(
      startResolution,
      startChoice,
      startLocal,
      initialStartLocal,
      initialStartChoice,
      banner?.startAt ?? null,
    ),
  );
  const resolvedEnd = $derived(
    selectedInstant(
      endResolution,
      endChoice,
      endLocal,
      initialEndLocal,
      initialEndChoice,
      banner?.endAt ?? null,
    ),
  );
  const scheduleInvalid = $derived(
    (banner?.status === 'PUBLISHED' && resolvedStart === null) ||
      (startLocal !== '' && resolvedStart === null) ||
      (endLocal !== '' && resolvedEnd === null) ||
      (resolvedStart !== null && resolvedEnd !== null && resolvedEnd <= resolvedStart),
  );
  const pageTargetErrors = $derived(pageTargets.map(validateBannerPageTarget));
  const pageTargetsInvalid = $derived(
    !allPages && (pageTargets.length === 0 || pageTargetErrors.some((error) => error !== null)),
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
      audience,
      placement: banner?.placement ?? 'SITE_TOP',
      pageTargets: allPages ? [{ kind: 'ALL' }] : pageTargets.map((target) => ({ ...target })),
      startAt: resolvedStart,
      endAt: resolvedEnd,
    };
  }

  function selectedInstant(
    resolution: LocalMinuteResolution | null,
    choice: string,
    localValue: string,
    originalLocal: string,
    originalChoice: string,
    originalInstant: string | null,
  ) {
    if (originalInstant && localValue === originalLocal && choice === originalChoice)
      return originalInstant;
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

  function addPageTarget() {
    pageTargets = [...pageTargets, { kind: 'EXACT', path: '/' }];
  }

  function removePageTarget(index: number) {
    pageTargets = pageTargets.filter((_, targetIndex) => targetIndex !== index);
  }

  function updatePageTarget(index: number, target: TargetedPage) {
    pageTargets = pageTargets.map((current, targetIndex) =>
      targetIndex === index ? target : current,
    );
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

      <fieldset disabled={banner?.lifecycle === 'EXPIRED'}>
        <legend class="font-bold">Schedule</legend>
        <p class="mt-1 text-sm text-surface-600">
          {#if banner?.lifecycle === 'EXPIRED'}
            Expired banner schedules cannot be changed.
          {:else if banner?.status === 'PUBLISHED'}
            Times use your local timezone ({timeZone}) at minute precision. Change Start to move
            this occurrence; leave End blank to keep it active until it is disabled.
          {:else}
            Times use your local timezone ({timeZone}) at minute precision. Leave Start blank to
            publish immediately using the server's current UTC time.
          {/if}
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
                {#if banner?.status === 'PUBLISHED'}
                  <span class="text-error-700">A published banner needs a start time.</span>
                {:else}
                  Server UTC when published.
                {/if}
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

      <fieldset>
        <legend class="font-bold">Audience</legend>
        <div class="mt-2 flex flex-wrap gap-6">
          {#each audienceOptions as option}
            <label class="flex items-center gap-2">
              <input type="radio" name="audience" value={option.value} bind:group={audience} />
              {option.label}
            </label>
          {/each}
        </div>
      </fieldset>

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
        <fieldset class="mt-5 border-t border-surface-300 pt-4">
          <legend class="font-bold">Pages</legend>
          <p class="mt-1 text-sm text-surface-600">
            Match application pathnames. Query strings and fragments are ignored.
          </p>
          <div class="mt-3 flex flex-wrap gap-6">
            <label class="flex items-center gap-2">
              <input type="radio" name="page-target-mode" value={true} bind:group={allPages} />
              All pages
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" name="page-target-mode" value={false} bind:group={allPages} />
              Specific pages
            </label>
          </div>

          {#if !allPages}
            <div class="mt-4 grid gap-4">
              {#each pageTargets as target, index}
                <div
                  class="grid gap-2 rounded border border-surface-300 p-3 sm:grid-cols-[12rem_1fr_auto]"
                >
                  <label class="grid content-start gap-1">
                    <span class="font-bold">Target {index + 1} type</span>
                    <select
                      class="select"
                      value={target.kind}
                      onchange={(event) =>
                        updatePageTarget(index, {
                          kind: event.currentTarget.value as TargetedPage['kind'],
                          path: target.path,
                        })}
                    >
                      <option value="EXACT">Exact page</option>
                      <option value="SUBTREE">Page and subtree</option>
                      <option value="PARAMETERIZED">Parameterized route</option>
                    </select>
                  </label>
                  <div class="grid content-start gap-1">
                    <label class="font-bold" for={`banner-page-target-${index}-path`}>
                      Target {index + 1} path
                    </label>
                    <input
                      id={`banner-page-target-${index}-path`}
                      class="input"
                      type="text"
                      placeholder="/help"
                      value={target.path}
                      aria-describedby={pageTargetErrors[index]
                        ? `banner-page-target-${index}-error`
                        : undefined}
                      oninput={(event) =>
                        updatePageTarget(index, { ...target, path: event.currentTarget.value })}
                    />
                    {#if pageTargetErrors[index]}
                      <span id={`banner-page-target-${index}-error`} class="text-sm text-error-700"
                        >{pageTargetErrors[index]}</span
                      >
                    {/if}
                  </div>
                  <button
                    type="button"
                    class="btn preset-tonal-error self-start sm:mt-7"
                    aria-label={`Remove target ${index + 1}`}
                    onclick={() => removePageTarget(index)}
                  >
                    Remove
                  </button>
                </div>
              {/each}
              {#if pageTargets.length === 0}
                <p class="text-sm text-error-700">Add at least one page target.</p>
              {/if}
              <button
                type="button"
                class="btn preset-tonal-primary justify-self-start"
                onclick={addPageTarget}
              >
                Add page target
              </button>
            </div>
          {/if}
        </fieldset>
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
            scheduleInvalid ||
            pageTargetsInvalid}
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
          scheduleInvalid ||
          pageTargetsInvalid}
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

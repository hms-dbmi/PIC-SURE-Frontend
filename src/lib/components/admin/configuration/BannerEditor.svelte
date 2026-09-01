<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import BannerPageTargetFields from '$lib/components/admin/configuration/BannerPageTargetFields.svelte';
  import BannerScheduleFields from '$lib/components/admin/configuration/BannerScheduleFields.svelte';
  import SiteBanner from '$lib/components/banner/SiteBanner.svelte';
  import Editor from '$lib/components/editor/Editor.svelte';
  import UnsavedChangesModal from '$lib/components/UnsavedChangesModal.svelte';
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
    restoreBanner,
  } from '$lib/services/BannerManagement';
  import { toaster } from '$lib/toaster';
  import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';
  import {
    formatInstantAsLocalMinute,
    resolveLocalMinute,
    type LocalMinuteResolution,
  } from '$lib/utilities/BannerSchedule';
  import { validateBannerPageTarget } from '$lib/utilities/BannerPageTargets';
  import { createUnsavedGuard } from '$lib/utilities/UnsavedGuard.svelte';

  type TargetedPage = Exclude<BannerPageTarget, { kind: 'ALL' }>;
  type EditorTransition = { kind: 'cancel' } | { kind: 'tab'; destination: string };
  const MAX_TIMEOUT_MS = 2_147_483_647;

  interface Props {
    banner?: ManagedBanner | null;
    mode?: 'create' | 'edit' | 'restore';
    onsuccess?: (banner: ManagedBanner) => void;
    oncancel?: () => void;
    ondirtychange?: (dirty: boolean) => void;
    tabchangerequest?: string | null;
    ontabchangerequestresolve?: (destination: string | null) => void;
  }

  let {
    banner = null,
    mode = undefined,
    onsuccess = () => {},
    oncancel = () => {},
    ondirtychange = () => {},
    tabchangerequest = null,
    ontabchangerequestresolve = () => {},
  }: Props = $props();
  const editorMode = untrack(() => mode ?? (banner ? 'edit' : 'create'));
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
    editorMode !== 'restore' && banner?.startAt
      ? formatInstantAsLocalMinute(banner.startAt, timeZone)
      : '',
  );
  const initialEndLocal = untrack(() =>
    editorMode !== 'restore' && banner?.endAt
      ? formatInstantAsLocalMinute(banner.endAt, timeZone)
      : '',
  );
  const initialStartChoice = untrack(() =>
    editorMode !== 'restore' && banner?.startAt ? new Date(banner.startAt).toISOString() : '',
  );
  const initialEndChoice = untrack(() =>
    editorMode !== 'restore' && banner?.endAt ? new Date(banner.endAt).toISOString() : '',
  );
  const initialPageTargets = untrack(() => banner?.pageTargets ?? [{ kind: 'ALL' as const }]);

  let htmlContent = $state(
    untrack(() =>
      editorMode === 'restore'
        ? sanitizeBannerHTML(banner?.htmlContent ?? '')
        : (banner?.htmlContent ?? ''),
    ),
  );
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
  let restoreValidationNow = $state(Date.now());
  let restoreStartTimeout: number | undefined;

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
      editorMode === 'restore' ? null : (banner?.startAt ?? null),
    ),
  );
  const resolvedEnd = $derived(
    selectedInstant(
      endResolution,
      endChoice,
      endLocal,
      initialEndLocal,
      initialEndChoice,
      editorMode === 'restore' ? null : (banner?.endAt ?? null),
    ),
  );
  const restoreStartNotFuture = $derived(restoreStartIsNotFuture(restoreValidationNow));
  const scheduleInvalid = $derived(
    (editorMode === 'edit' && banner?.status === 'PUBLISHED' && resolvedStart === null) ||
      (startLocal !== '' && resolvedStart === null) ||
      (endLocal !== '' && resolvedEnd === null) ||
      restoreStartNotFuture ||
      (resolvedStart !== null && resolvedEnd !== null && resolvedEnd <= resolvedStart),
  );
  const pageTargetErrors = $derived(pageTargets.map(validateBannerPageTarget));
  const pageTargetsInvalid = $derived(
    !allPages && (pageTargets.length === 0 || pageTargetErrors.some((error) => error !== null)),
  );
  const scheduleDisabled = $derived(editorMode !== 'restore' && banner?.lifecycle === 'EXPIRED');
  const startMissingError = $derived(editorMode === 'edit' && banner?.status === 'PUBLISHED');
  const scheduleDescription = $derived(
    scheduleDisabled
      ? 'Expired banner schedules cannot be changed.'
      : editorMode === 'restore'
        ? `Times use your local timezone (${timeZone}) at minute precision. Leave Start blank to bring the copied banner back immediately using the server's current UTC time.`
        : banner?.status === 'PUBLISHED'
          ? `Times use your local timezone (${timeZone}) at minute precision. Change Start to move this occurrence; leave End blank to keep it active until it is disabled.`
          : `Times use your local timezone (${timeZone}) at minute precision. Leave Start blank to publish immediately using the server's current UTC time.`,
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

  function restoreStartIsNotFuture(now: number) {
    return (
      editorMode === 'restore' && resolvedStart !== null && new Date(resolvedStart).getTime() <= now
    );
  }

  function clearRestoreStartTimeout() {
    if (restoreStartTimeout === undefined) return;
    window.clearTimeout(restoreStartTimeout);
    restoreStartTimeout = undefined;
  }

  function scheduleRestoreStartCheck(startAt: number) {
    const now = Date.now();
    restoreValidationNow = now;
    const delay = startAt - now;
    if (delay <= 0) return;
    restoreStartTimeout = window.setTimeout(
      () => {
        restoreStartTimeout = undefined;
        scheduleRestoreStartCheck(startAt);
      },
      Math.min(delay, MAX_TIMEOUT_MS),
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

  function adoptAuthoritativePageTargets(authoritative: ManagedBanner) {
    allPages = authoritative.pageTargets.some((target) => target.kind === 'ALL');
    pageTargets = authoritative.pageTargets
      .filter((target): target is TargetedPage => target.kind !== 'ALL')
      .map((target) => ({ ...target }));
  }

  let initialSnapshot = $state(snapshot());
  const dirty = $derived(editorMode === 'restore' || snapshot() !== initialSnapshot);
  const guard = createUnsavedGuard<EditorTransition>(() => dirty);
  const pendingTabDestination = $derived(
    (guard.pending?.kind === 'tab' ? guard.pending.destination : null) ?? tabchangerequest,
  );

  $effect(() => {
    ondirtychange(dirty);
  });

  $effect(() => {
    const startAt = resolvedStart;
    clearRestoreStartTimeout();
    restoreValidationNow = Date.now();
    if (editorMode === 'restore' && startAt !== null) {
      scheduleRestoreStartCheck(new Date(startAt).getTime());
    }
  });

  $effect(() => {
    const request = tabchangerequest;
    if (!request) return;
    untrack(() => {
      if (!guard.intercept({ kind: 'tab', destination: request })) {
        ontabchangerequestresolve(request);
      }
    });
  });

  onDestroy(() => {
    clearRestoreStartTimeout();
    ondirtychange(false);
  });

  function requestCancel() {
    if (!guard.intercept({ kind: 'cancel' })) oncancel();
  }

  function keepEditing() {
    const wasTabChange = pendingTabDestination !== null;
    guard.take();
    if (wasTabChange) ontabchangerequestresolve(null);
  }

  async function discardChanges() {
    const tabDestination = pendingTabDestination;
    const pending = guard.take();
    if (tabDestination) {
      ontabchangerequestresolve(tabDestination);
    } else if (pending?.kind === 'cancel') {
      oncancel();
    } else if (pending?.kind === 'navigation' && pending.url) {
      await guard.navigate(pending.url);
    }
  }

  async function saveForLater() {
    if (working) return;
    working = 'save';
    try {
      const saved = banner
        ? await updateSavedBanner(banner.uuid, draft())
        : await saveBanner(draft());
      adoptAuthoritativePageTargets(saved);
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
    const submitNow = Date.now();
    if (restoreStartIsNotFuture(submitNow)) {
      restoreValidationNow = submitNow;
      return;
    }
    working = 'publish';
    try {
      const published =
        editorMode === 'restore' && banner
          ? await restoreBanner(banner.uuid, draft())
          : banner?.status === 'PUBLISHED'
            ? await updatePublishedBanner(banner.uuid, draft())
            : banner
              ? await publishSavedBanner(banner.uuid, draft())
              : await publishBanner(draft());
      adoptAuthoritativePageTargets(published);
      if (editorMode !== 'restore') initialSnapshot = snapshot();
      toaster.success({
        title:
          editorMode === 'restore'
            ? startLocal
              ? 'Banner scheduled'
              : 'Banner restored'
            : banner?.status === 'PUBLISHED'
              ? 'Banner updated'
              : startLocal
                ? 'Banner scheduled'
                : 'Banner published',
      });
      onsuccess(published);
    } catch {
      if (editorMode === 'restore') {
        toaster.error({
          title: startLocal ? 'Banner could not be scheduled' : 'Banner could not be restored',
          description: 'The source banner is unchanged. Your copied changes are still here.',
        });
      } else if (banner?.status === 'PUBLISHED') {
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

<UnsavedChangesModal
  open={guard.open}
  keepLabel="Keep editing"
  discardLabel="Discard changes"
  onkeep={keepEditing}
  ondiscard={discardChanges}
>
  {#if pendingTabDestination}
    You have unsaved banner changes. Discard them to open {pendingTabDestination}, or keep editing.
  {:else}
    You have unsaved banner changes. Discard them or keep editing.
  {/if}
</UnsavedChangesModal>

<section class="mx-auto max-w-5xl" aria-labelledby="banner-editor-title">
  <header class="mb-6">
    <h2 id="banner-editor-title">
      {editorMode === 'restore'
        ? 'Restore banner'
        : banner?.status === 'PUBLISHED'
          ? 'Edit published banner'
          : banner
            ? 'Edit saved banner'
            : 'Create banner'}
    </h2>
    <p>
      {editorMode === 'restore'
        ? 'Review this copy and choose when it should return. Restoring creates a new occurrence and archives the source after success.'
        : banner?.status === 'PUBLISHED'
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

      <BannerScheduleFields
        bind:startLocal
        bind:endLocal
        bind:startChoice
        bind:endChoice
        {startResolution}
        {endResolution}
        {resolvedStart}
        {resolvedEnd}
        disabled={scheduleDisabled}
        description={scheduleDescription}
        {startMissingError}
        {restoreStartNotFuture}
      />

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
        <BannerPageTargetFields bind:allPages bind:pageTargets errors={pageTargetErrors} />
      </details>
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <button type="button" class="btn preset-tonal-primary mr-auto" onclick={requestCancel}>
        Cancel
      </button>
      {#if editorMode !== 'restore' && banner?.status !== 'PUBLISHED'}
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
          (editorMode === 'edit' && banner?.status === 'PUBLISHED' && !dirty) ||
          !hasContent ||
          sanitizedLength > 5_000 ||
          scheduleInvalid ||
          pageTargetsInvalid}
      >
        {working === 'publish'
          ? editorMode === 'restore'
            ? startLocal
              ? 'Scheduling...'
              : 'Restoring...'
            : banner?.status === 'PUBLISHED'
              ? 'Saving...'
              : startLocal
                ? 'Scheduling...'
                : 'Publishing...'
          : editorMode === 'restore'
            ? startLocal
              ? 'Schedule banner'
              : 'Restore'
            : banner?.status === 'PUBLISHED'
              ? 'Save changes'
              : startLocal
                ? 'Schedule banner'
                : 'Publish now'}
      </button>
    </div>
  </form>
</section>

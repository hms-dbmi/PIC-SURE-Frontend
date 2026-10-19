<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { onDestroy, untrack } from 'svelte';
  import BannerPageTargetFields from '#lib/banners/components/admin/fields/PageTargetFields.svelte';
  import BannerScheduleFields from '#lib/banners/components/admin/fields/ScheduleFields.svelte';
  import SiteBanner from '#lib/banners/components/SiteBanner.svelte';
  import Editor from '#lib/ui/Editor.svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import type { BannerIcon, ManagedBanner } from '#lib/banners/model/banner.ts';
  import {
    BANNER_APPEARANCES,
    BANNER_AUDIENCES,
    BANNER_AUDIENCE_LABELS,
    BANNER_ICONS,
  } from '#lib/banners/model/banner.ts';
  import { BANNER_CONTENT_MAX_LENGTH, BANNER_TITLE_MAX_LENGTH } from '#lib/banners/model/limits.ts';
  import { BANNER_APPEARANCE_PRESENTATION } from '#lib/banners/components/presentation.ts';
  import { BannerDraftForm, type BannerEditorMode } from '#lib/banners/draft.svelte.ts';
  import { sanitizeBannerHTML } from '#lib/banners/model/html.ts';
  import { createUnsavedGuard } from '#lib/ui/unsavedGuard.svelte.ts';
  import { cardClass } from '#lib/ui/surface.ts';

  type EditorTransition = { kind: 'cancel' } | { kind: 'tab'; destination: string };

  interface Props {
    banner?: ManagedBanner | null;
    mode?: BannerEditorMode;
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
  // The management view mounts a new editor for each banner it opens, so the form reads its
  // source once.
  const form = untrack(() => new BannerDraftForm(banner, mode));
  const contentLimit = BANNER_CONTENT_MAX_LENGTH.toLocaleString('en-US');
  const appearanceOptions = BANNER_APPEARANCES.map((value) => ({
    value,
    ...BANNER_APPEARANCE_PRESENTATION[value],
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
  let linkFeedback = $state('');

  function reportSanitizedLinks(originalHTML: string, sanitizedHTML: string) {
    const parser = new DOMParser();
    const originalLinks = parser
      .parseFromString(originalHTML, 'text/html')
      .querySelectorAll('a[href]').length;
    const sanitizedLinks = parser
      .parseFromString(sanitizedHTML, 'text/html')
      .querySelectorAll('a[href]').length;
    const removedLinks = originalLinks - sanitizedLinks;
    const removal =
      removedLinks === 1
        ? 'An unsupported link was removed.'
        : `${removedLinks} unsupported links were removed.`;
    linkFeedback =
      removedLinks > 0 ? `${removal} Use a relative path, an HTTPS link, or an email link.` : '';
  }

  const scheduleDescription = $derived(
    form.scheduleDisabled
      ? 'Expired banner schedules cannot be changed.'
      : form.mode === 'restore'
        ? `Times use your local timezone (${form.timeZone}) at minute precision. Leave Start blank to bring the copied banner back immediately using the server's current UTC time.`
        : form.isPublished
          ? `Times use your local timezone (${form.timeZone}) at minute precision. Change Start to move this occurrence; leave End blank to keep it active until it is disabled.`
          : `Times use your local timezone (${form.timeZone}) at minute precision. Leave Start blank to publish immediately using the server's current UTC time.`,
  );
  const editorCopy =
    form.mode === 'restore'
      ? {
          heading: 'Restore banner',
          description:
            'Review this copy and choose when it should return. Restoring creates a new occurrence and archives the source after success.',
        }
      : form.isPublished
        ? {
            heading: 'Edit published banner',
            description:
              'Correct the published announcement. Saved changes take effect immediately.',
          }
        : form.banner
          ? {
              heading: 'Edit saved banner',
              description: 'Update this reusable draft or publish it across PIC-SURE.',
            }
          : {
              heading: 'Create banner',
              description: 'Save this announcement for later or publish it across PIC-SURE.',
            };

  const guard = createUnsavedGuard<EditorTransition>(() => form.dirty);
  const pendingTabDestination = $derived(
    (guard.pending?.kind === 'tab' ? guard.pending.destination : null) ?? tabchangerequest,
  );

  $effect(() => {
    ondirtychange(form.dirty);
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
    const saved = await form.save();
    if (saved) onsuccess(saved);
  }

  async function publish() {
    const published = await form.publish();
    if (published) onsuccess(published);
  }
</script>

<ConfirmDialog
  bind:open={guard.open}
  title="Unsaved Changes"
  closeable={false}
  cancelLabel="Keep editing"
  confirmLabel="Discard changes"
  tone="danger"
  oncancel={keepEditing}
  onconfirm={discardChanges}
>
  {#if pendingTabDestination}
    You have unsaved banner changes. Discard them to open {pendingTabDestination}, or keep editing.
  {:else}
    You have unsaved banner changes. Discard them or keep editing.
  {/if}
</ConfirmDialog>

<section class="mx-auto max-w-5xl" aria-labelledby="banner-editor-title">
  <header class="mb-6">
    <h2 id="banner-editor-title">{editorCopy.heading}</h2>
    <p>{editorCopy.description}</p>
  </header>

  <form
    data-testid="banner-editor-form"
    class="{cardClass} p-6"
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
            onsanitize={reportSanitizedLinks}
            convertQuillClasses={false}
            reconcileSanitizedDocument
            normalizeNonBreakingSpaces
            ariaLabel="Banner content"
            ariaDescribedBy="banner-content-help"
            bind:content={form.htmlContent}
          />
        </div>
        <div id="banner-content-help" class="text-sm text-surface-600">
          <p class="mt-1">
            Basic formatting, lists, relative links, HTTPS links, and email links are supported.
          </p>
          <p aria-live="polite" aria-atomic="true">{linkFeedback}</p>
          <p>
            {form.sanitizedLength}/{contentLimit} sanitized HTML characters.
            <span class="text-error-700" aria-live="polite">
              {#if form.contentTooLong}
                Content exceeds the {contentLimit}-character limit. Shorten it before publishing.
              {/if}
            </span>
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
              <input
                type="radio"
                name="appearance"
                value={option.value}
                bind:group={form.appearance}
              />
              <span
                data-testid="banner-appearance-swatch"
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
            <input type="radio" name="dismissal" value={true} bind:group={form.dismissible} />
            Dismissible
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" name="dismissal" value={false} bind:group={form.dismissible} />
            Permanent
          </label>
        </div>
      </fieldset>

      <section
        class="rounded border border-dashed border-surface-500 bg-surface-100 p-4"
        aria-labelledby="banner-preview-title"
      >
        <h3 id="banner-preview-title" class="mb-3">Banner preview</h3>
        <SiteBanner banner={form.preview} titleLevel={3} />
      </section>

      <BannerScheduleFields
        bind:startLocal={form.startLocal}
        bind:endLocal={form.endLocal}
        bind:startChoice={form.startChoice}
        bind:endChoice={form.endChoice}
        startResolution={form.startResolution}
        endResolution={form.endResolution}
        resolvedStart={form.resolvedStart}
        resolvedEnd={form.resolvedEnd}
        disabled={form.scheduleDisabled}
        description={scheduleDescription}
        startMissingError={form.startMissingError}
        restoreStartNotFuture={form.restoreStartNotFuture}
      />

      <fieldset>
        <legend class="font-bold">Audience</legend>
        <div class="mt-2 flex flex-wrap gap-6">
          {#each audienceOptions as option}
            <label class="flex items-center gap-2">
              <input type="radio" name="audience" value={option.value} bind:group={form.audience} />
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
            <input
              class="input"
              type="text"
              maxlength={BANNER_TITLE_MAX_LENGTH}
              bind:value={form.title}
            />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">Icon</span>
            <select class="select" bind:value={form.icon}>
              {#each iconOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </label>
        </div>
        <BannerPageTargetFields
          bind:allPages={form.allPages}
          bind:pageTargets={form.pageTargets}
          errors={form.pageTargetErrors}
        />
      </details>
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <Button variant="tint" class="mr-auto" onclick={requestCancel}>Cancel</Button>
      {#if form.canSaveForLater}
        <Button variant="soft-static" disabled={!form.canSave} onclick={saveForLater}>
          {form.working === 'save' ? 'Saving...' : form.banner ? 'Save changes' : 'Save for later'}
        </Button>
      {/if}
      <Button type="submit" disabled={!form.canPublish}>
        {form.working === 'publish' ? form.publishCopy.busyLabel : form.publishCopy.submitLabel}
      </Button>
    </div>
  </form>
</section>

import {
  publishBanner,
  publishSavedBanner,
  restoreBanner,
  saveBanner,
  updatePublishedBanner,
  updateSavedBanner,
} from '#lib/api/picsure/banners.ts';
import type {
  BannerAppearance,
  BannerAudience,
  BannerDraft,
  BannerIcon,
  BannerPageTarget,
  BannerPresentation,
  ManagedBanner,
} from '#lib/banners/model/banner.ts';
import { hasBannerContent, sanitizeBannerHTML } from '#lib/banners/model/html.ts';
import { BANNER_CONTENT_MAX_LENGTH } from '#lib/banners/model/limits.ts';
import { validateBannerPageTarget } from '#lib/banners/model/pageTargets.ts';
import {
  canonicalInstant,
  formatInstantAsLocalMinute,
  resolveLocalMinute,
  type LocalMinuteResolution,
} from '#lib/banners/model/schedule.ts';
import { toaster } from '#lib/ui/toaster.ts';

export type BannerEditorMode = 'create' | 'edit' | 'restore';
export type TargetedPage = Exclude<BannerPageTarget, { kind: 'ALL' }>;
type PublishIntent = 'restore' | 'schedule-restore' | 'update-published' | 'schedule' | 'publish';

interface PublishCopy {
  submitLabel: string;
  busyLabel: string;
  successToast: string;
  errorToast: string;
  errorDescription: string;
}

const RESTORE_ERROR_DESCRIPTION =
  'The source banner is unchanged. Your copied changes are still here.';
const PUBLISH_COPY: Record<PublishIntent, PublishCopy> = {
  restore: {
    submitLabel: 'Restore',
    busyLabel: 'Restoring...',
    successToast: 'Banner restored',
    errorToast: 'Banner could not be restored',
    errorDescription: RESTORE_ERROR_DESCRIPTION,
  },
  'schedule-restore': {
    submitLabel: 'Schedule banner',
    busyLabel: 'Scheduling...',
    successToast: 'Banner scheduled',
    errorToast: 'Banner could not be scheduled',
    errorDescription: RESTORE_ERROR_DESCRIPTION,
  },
  'update-published': {
    submitLabel: 'Save changes',
    busyLabel: 'Saving...',
    successToast: 'Banner updated',
    errorToast: 'Banner could not be updated',
    errorDescription: 'The changes were not saved. Check your connection and try again.',
  },
  schedule: {
    submitLabel: 'Schedule banner',
    busyLabel: 'Scheduling...',
    successToast: 'Banner scheduled',
    errorToast: 'Banner could not be scheduled',
    errorDescription: 'The banner was not scheduled. Check your connection and try again.',
  },
  publish: {
    submitLabel: 'Publish now',
    busyLabel: 'Publishing...',
    successToast: 'Banner published',
    errorToast: 'Banner could not be published',
    errorDescription: 'The banner was not published. Check your connection and try again.',
  },
};

function targetedPages(targets: BannerPageTarget[]): TargetedPage[] {
  return targets
    .filter((target): target is TargetedPage => target.kind !== 'ALL')
    .map((target) => ({ ...target }));
}

/**
 * The banner editor's form: the fields, their validation, and saving or publishing the result.
 * Create a new one for each banner opened; the source banner and mode are fixed for its lifetime.
 */
export class BannerDraftForm {
  readonly banner: ManagedBanner | null;
  readonly mode: BannerEditorMode;
  readonly timeZone: string;
  readonly #initialStartLocal: string;
  readonly #initialEndLocal: string;
  readonly #initialStartChoice: string;
  readonly #initialEndChoice: string;

  htmlContent: string = $state('');
  title: string = $state('');
  appearance: BannerAppearance = $state('PRIMARY');
  icon: BannerIcon = $state('NONE');
  dismissible: boolean = $state(true);
  audience: BannerAudience = $state('EVERYONE');
  allPages: boolean = $state(true);
  pageTargets: TargetedPage[] = $state([]);
  startLocal: string = $state('');
  endLocal: string = $state('');
  startChoice: string = $state('');
  endChoice: string = $state('');
  working: 'save' | 'publish' | null = $state(null);
  #savedSnapshot = $state('');

  constructor(
    banner: ManagedBanner | null,
    mode: BannerEditorMode = banner ? 'edit' : 'create',
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  ) {
    this.banner = banner;
    this.mode = mode;
    this.timeZone = timeZone;
    // A restored banner is a new occurrence: it starts unscheduled.
    const schedule = mode === 'restore' ? null : banner;
    this.#initialStartLocal = schedule?.startAt
      ? formatInstantAsLocalMinute(schedule.startAt, timeZone)
      : '';
    this.#initialEndLocal = schedule?.endAt
      ? formatInstantAsLocalMinute(schedule.endAt, timeZone)
      : '';
    this.#initialStartChoice = schedule?.startAt ? canonicalInstant(schedule.startAt) : '';
    this.#initialEndChoice = schedule?.endAt ? canonicalInstant(schedule.endAt) : '';

    this.htmlContent =
      mode === 'restore'
        ? sanitizeBannerHTML(banner?.htmlContent ?? '')
        : (banner?.htmlContent ?? '');
    this.title = banner?.title ?? '';
    this.appearance = banner?.appearance ?? 'PRIMARY';
    this.icon = banner?.icon ?? 'NONE';
    this.dismissible = banner?.dismissible ?? true;
    this.audience = banner?.audience ?? 'EVERYONE';
    this.#adoptPageTargets(banner?.pageTargets ?? [{ kind: 'ALL' }]);
    this.startLocal = this.#initialStartLocal;
    this.endLocal = this.#initialEndLocal;
    this.startChoice = this.#initialStartChoice;
    this.endChoice = this.#initialEndChoice;
    this.#savedSnapshot = this.#snapshot();
  }

  get isPublished() {
    return this.mode !== 'restore' && this.banner?.status === 'PUBLISHED';
  }

  get #editingPublished() {
    return this.mode === 'edit' && this.banner?.status === 'PUBLISHED';
  }

  /** A published banner must keep a start. */
  get startMissingError() {
    return this.#editingPublished;
  }

  get scheduleDisabled() {
    return this.mode !== 'restore' && this.banner?.lifecycle === 'EXPIRED';
  }

  /** Save for later exists only for new and saved banners. */
  get canSaveForLater() {
    return this.mode !== 'restore' && !this.isPublished;
  }

  readonly sanitizedLength = $derived(sanitizeBannerHTML(this.htmlContent).length);
  readonly contentTooLong = $derived(this.sanitizedLength > BANNER_CONTENT_MAX_LENGTH);
  readonly hasContent = $derived(hasBannerContent(this.htmlContent));
  // The .by() forms read the fields the constructor sets inside a closure, which TypeScript
  // accepts; a plain $derived initializer reading them fails svelte-check.
  readonly startResolution = $derived.by(() =>
    this.startLocal ? resolveLocalMinute(this.startLocal, this.timeZone) : null,
  );
  readonly endResolution = $derived.by(() =>
    this.endLocal ? resolveLocalMinute(this.endLocal, this.timeZone) : null,
  );
  readonly resolvedStart = $derived.by(() =>
    this.#selectedInstant(
      this.startResolution,
      this.startChoice,
      this.startLocal,
      this.#initialStartLocal,
      this.#initialStartChoice,
      this.mode === 'restore' ? null : (this.banner?.startAt ?? null),
    ),
  );
  readonly resolvedEnd = $derived.by(() =>
    this.#selectedInstant(
      this.endResolution,
      this.endChoice,
      this.endLocal,
      this.#initialEndLocal,
      this.#initialEndChoice,
      this.mode === 'restore' ? null : (this.banner?.endAt ?? null),
    ),
  );
  // When the restore start was last checked against the clock: whenever it changes, and again on
  // submit (publish() overrides it), so a start that has since passed is caught.
  #restoreCheckedAt = $derived.by(() => {
    void this.resolvedStart;
    return Date.now();
  });
  readonly restoreStartNotFuture = $derived(this.#restoreStartIsNotFuture(this.#restoreCheckedAt));
  readonly scheduleInvalid = $derived(
    (this.startMissingError && this.resolvedStart === null) ||
      (this.startLocal !== '' && this.resolvedStart === null) ||
      (this.endLocal !== '' && this.resolvedEnd === null) ||
      this.restoreStartNotFuture ||
      (this.resolvedStart !== null &&
        this.resolvedEnd !== null &&
        Date.parse(this.resolvedEnd) <= Date.parse(this.resolvedStart)),
  );
  readonly pageTargetErrors = $derived(this.pageTargets.map(validateBannerPageTarget));
  readonly pageTargetsInvalid = $derived(
    !this.allPages &&
      (this.pageTargets.length === 0 || this.pageTargetErrors.some((error) => error !== null)),
  );
  readonly preview: BannerPresentation = $derived({
    htmlContent: this.htmlContent,
    title: this.title.trim() || null,
    appearance: this.appearance,
    icon: this.icon,
    dismissible: this.dismissible,
  });
  readonly publishCopy = $derived(PUBLISH_COPY[this.#publishIntent()]);
  // Restoring always creates something new, so it never counts as clean.
  readonly dirty = $derived.by(
    () => this.mode === 'restore' || this.#snapshot() !== this.#savedSnapshot,
  );
  readonly #submittable = $derived(
    this.working === null &&
      this.hasContent &&
      !this.contentTooLong &&
      !this.scheduleInvalid &&
      !this.pageTargetsInvalid,
  );
  readonly canSave = $derived(this.#submittable && this.dirty);
  readonly canPublish = $derived.by(
    () => this.#submittable && !(this.#editingPublished && !this.dirty),
  );

  draft(): BannerDraft {
    return {
      ...this.preview,
      title: this.title,
      audience: this.audience,
      placement: this.banner?.placement ?? 'SITE_TOP',
      pageTargets: this.allPages
        ? [{ kind: 'ALL' }]
        : this.pageTargets.map((target) => ({ ...target })),
      startAt: this.resolvedStart,
      endAt: this.resolvedEnd,
    };
  }

  /** Saves without publishing. Resolves the saved banner, or undefined after showing the error. */
  async save(): Promise<ManagedBanner | undefined> {
    if (this.working) return;
    this.working = 'save';
    const { banner } = this;
    try {
      const saved = banner
        ? await updateSavedBanner(banner.uuid, this.draft())
        : await saveBanner(this.draft());
      this.#adoptPageTargets(saved.pageTargets);
      this.#savedSnapshot = this.#snapshot();
      toaster.success({ title: banner ? 'Banner changes saved' : 'Banner saved for later' });
      return saved;
    } catch {
      toaster.error({
        title: 'Banner could not be saved',
        description: 'Your changes are still here. Check your connection and try again.',
      });
    } finally {
      this.working = null;
    }
  }

  /**
   * Publishes, schedules, updates or restores, whichever the form is for. Resolves the
   * resulting banner, or undefined after showing the error or a restore start that has passed.
   */
  async publish(): Promise<ManagedBanner | undefined> {
    if (this.working) return;
    const submitNow = Date.now();
    if (this.#restoreStartIsNotFuture(submitNow)) {
      this.#restoreCheckedAt = submitNow;
      return;
    }
    this.working = 'publish';
    const { banner } = this;
    const copy = this.publishCopy;
    try {
      const published =
        this.mode === 'restore' && banner
          ? await restoreBanner(banner.uuid, this.draft())
          : banner?.status === 'PUBLISHED'
            ? await updatePublishedBanner(banner.uuid, this.draft())
            : banner
              ? await publishSavedBanner(banner.uuid, this.draft())
              : await publishBanner(this.draft());
      this.#adoptPageTargets(published.pageTargets);
      if (this.mode !== 'restore') this.#savedSnapshot = this.#snapshot();
      toaster.success({ title: copy.successToast });
      return published;
    } catch {
      toaster.error({ title: copy.errorToast, description: copy.errorDescription });
    } finally {
      this.working = null;
    }
  }

  #publishIntent(): PublishIntent {
    if (this.mode === 'restore') return this.startLocal ? 'schedule-restore' : 'restore';
    if (this.banner?.status === 'PUBLISHED') return 'update-published';
    return this.startLocal ? 'schedule' : 'publish';
  }

  // The server normalizes page targets; adopting its copy keeps the form clean after a save.
  #adoptPageTargets(targets: BannerPageTarget[]) {
    this.allPages = targets.some((target) => target.kind === 'ALL');
    this.pageTargets = targetedPages(targets);
  }

  #selectedInstant(
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

  #restoreStartIsNotFuture(now: number) {
    return (
      this.mode === 'restore' &&
      this.resolvedStart !== null &&
      Date.parse(this.resolvedStart) <= now
    );
  }

  #snapshot() {
    const value = this.draft();
    return JSON.stringify({
      ...value,
      htmlContent: sanitizeBannerHTML(value.htmlContent),
      scheduleInput: {
        startLocal: this.startLocal,
        endLocal: this.endLocal,
        startChoice: this.startChoice,
        endChoice: this.endChoice,
      },
    });
  }
}

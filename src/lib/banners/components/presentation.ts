import type { BannerAppearance, BannerLifecycle } from '#lib/banners/model/banner.ts';
import { tones, warningMessageClass } from '#lib/ui/surface.ts';

// How each appearance and lifecycle status looks, for the site banner, the admin rows and the
// editor. Class strings are complete so Tailwind generates them.

export const BANNER_APPEARANCE_PRESENTATION: Record<
  BannerAppearance,
  { label: string; swatchClass: string; toneClass: string }
> = {
  PRIMARY: {
    label: 'Primary',
    swatchClass: 'bg-primary-500',
    toneClass: `${tones['tonal-primary']} border-primary-500`,
  },
  SECONDARY: {
    label: 'Secondary',
    swatchClass: 'bg-secondary-500',
    toneClass: `${tones['tonal-secondary']} border-secondary-500`,
  },
  TERTIARY: {
    label: 'Tertiary',
    swatchClass: 'bg-tertiary-500',
    toneClass: `${tones['tonal-tertiary']} border-tertiary-500`,
  },
  SUCCESS: {
    label: 'Success',
    swatchClass: 'bg-success-500',
    toneClass: `${tones['tonal-success']} border-success-500`,
  },
  WARNING: {
    label: 'Warning',
    swatchClass: 'bg-warning-500',
    toneClass: warningMessageClass,
  },
  ERROR: {
    label: 'Error',
    swatchClass: 'bg-error-500',
    toneClass: `${tones['tonal-error']} border-error-500`,
  },
  SURFACE: {
    label: 'Surface',
    swatchClass: 'bg-surface-500',
    toneClass: `${tones['tonal-surface']} border-surface-500`,
  },
};

export const BANNER_LIFECYCLE_PRESENTATION: Record<
  BannerLifecycle,
  { label: string; badgeClass: string }
> = {
  ACTIVE: { label: 'Active', badgeClass: tones['tonal-success'] },
  SCHEDULED: { label: 'Scheduled', badgeClass: 'bg-surface-200' },
  SAVED: { label: 'Saved', badgeClass: tones['tonal-primary'] },
  DISABLED: { label: 'Disabled', badgeClass: 'bg-surface-200' },
  EXPIRED: { label: 'Expired', badgeClass: 'bg-surface-200' },
};

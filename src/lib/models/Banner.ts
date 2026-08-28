export const BANNER_APPEARANCES = [
  'PRIMARY',
  'SECONDARY',
  'TERTIARY',
  'SUCCESS',
  'WARNING',
  'ERROR',
  'SURFACE',
] as const;
export type BannerAppearance = (typeof BANNER_APPEARANCES)[number];

export const BANNER_APPEARANCE_DETAILS: Record<
  BannerAppearance,
  { label: string; swatchClass: string }
> = {
  PRIMARY: { label: 'Primary', swatchClass: 'bg-primary-500' },
  SECONDARY: { label: 'Secondary', swatchClass: 'bg-secondary-500' },
  TERTIARY: { label: 'Tertiary', swatchClass: 'bg-tertiary-500' },
  SUCCESS: { label: 'Success', swatchClass: 'bg-success-500' },
  WARNING: { label: 'Warning', swatchClass: 'bg-warning-500' },
  ERROR: { label: 'Error', swatchClass: 'bg-error-500' },
  SURFACE: { label: 'Surface', swatchClass: 'bg-surface-500' },
};

export const BANNER_ICONS = ['NONE', 'INFORMATION', 'SUCCESS', 'WARNING', 'ERROR'] as const;
export type BannerIcon = (typeof BANNER_ICONS)[number];

export const BANNER_AUDIENCES = ['EVERYONE', 'SIGNED_IN', 'SIGNED_OUT'] as const;
export type BannerAudience = (typeof BANNER_AUDIENCES)[number];

export const BANNER_PLACEMENTS = ['SITE_TOP'] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export interface BannerPresentation {
  htmlContent: string;
  title: string | null;
  appearance: BannerAppearance;
  icon: BannerIcon;
  dismissible: boolean;
}

export interface ActiveBanner extends BannerPresentation {
  uuid: string;
  audience: BannerAudience;
  placement: BannerPlacement;
  pageTargets: unknown[];
  priority: number;
  presentationHash: string;
}

export interface BannerDraft extends BannerPresentation {
  title: string;
  audience: BannerAudience;
  placement: BannerPlacement;
  pageTargets: unknown[];
}

export type BannerStatus = 'SAVED' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';
export type BannerLifecycle = 'ACTIVE' | 'SCHEDULED' | 'SAVED' | 'DISABLED' | 'EXPIRED';

export interface ManagedBanner extends BannerPresentation {
  uuid: string;
  status: BannerStatus;
  lifecycle: BannerLifecycle;
  audience: BannerAudience;
  placement: BannerPlacement;
  pageTargets: unknown[];
  startAt: string | null;
  endAt: string | null;
  priority: number | null;
  presentationHash: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string | null;
  publishedBy: string | null;
}

export type ManagementRecord = ManagedBanner & { excerpt: string };

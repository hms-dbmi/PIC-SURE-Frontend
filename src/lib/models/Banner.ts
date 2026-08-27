export type BannerAppearance =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'TERTIARY'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'SURFACE';

export type BannerIcon = 'NONE' | 'INFORMATION' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type BannerAudience = 'EVERYONE' | 'SIGNED_IN' | 'SIGNED_OUT';

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
  placement: 'SITE_TOP';
  pageTargets: unknown[];
  priority: number;
  presentationHash: string;
}

export interface BannerDraft extends BannerPresentation {
  title: string;
  audience: BannerAudience;
  placement: 'SITE_TOP';
  pageTargets: unknown[];
}

export interface PublishedBanner extends ActiveBanner {
  status: 'PUBLISHED';
  startAt: string;
  endAt: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string;
  publishedBy: string;
}

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

export interface ActiveBanner {
  uuid: string;
  htmlContent: string;
  title: string | null;
  appearance: BannerAppearance;
  icon: BannerIcon;
  dismissible: boolean;
  audience: BannerAudience;
  placement: 'SITE_TOP';
  pageTargets: unknown[];
  priority: number;
  presentationHash: string;
}

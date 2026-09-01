import { browser } from '$app/environment';

export const BANNER_DISMISSALS_STORAGE_KEY = 'site-banner-dismissals-v1';

export type BannerDismissals = Record<string, string>;

export function readBannerDismissals(): BannerDismissals {
  if (!browser) return {};

  try {
    const stored = window.sessionStorage.getItem(BANNER_DISMISSALS_STORAGE_KEY);
    if (stored === null) return {};

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => {
        return typeof entry[1] === 'string';
      }),
    );
  } catch {
    return {};
  }
}

export function writeBannerDismissals(dismissals: BannerDismissals): void {
  if (!browser) return;

  try {
    window.sessionStorage.setItem(BANNER_DISMISSALS_STORAGE_KEY, JSON.stringify(dismissals));
  } catch {
    // The in-memory dismissal still applies until this component is remounted.
  }
}

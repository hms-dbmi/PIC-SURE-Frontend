import {
  BANNER_APPEARANCES,
  BANNER_AUDIENCES,
  BANNER_ICONS,
  type ActiveBanner,
} from '#lib/banners/model/banner.ts';
import { parseBannerPageTargets } from '#lib/banners/model/pageTargets.ts';

const appearances = new Set<unknown>(BANNER_APPEARANCES);
const icons = new Set<unknown>(BANNER_ICONS);
const audiences = new Set<unknown>(BANNER_AUDIENCES);

type BannerFeedRecord = Omit<ActiveBanner, 'placement'> & { placement: string };

export interface ParsedBannerFeed {
  /** Valid records for the placements this app renders (only `SITE_TOP` today), in feed order. */
  banners: ActiveBanner[];
  /** Records dropped because they failed validation. */
  malformed: number;
}

/**
 * Validates the public feed. A malformed record is dropped and counted, a placement this app
 * doesn't render is dropped silently, and a feed that isn't an array throws.
 */
export function parseBannerFeed(feed: unknown): ParsedBannerFeed {
  if (!Array.isArray(feed)) throw new Error('Banner feed returned an invalid response');
  const records = feed.map(parseBannerFeedRecord).filter((record) => record !== null);
  return {
    banners: records.filter((banner): banner is ActiveBanner => banner.placement === 'SITE_TOP'),
    malformed: feed.length - records.length,
  };
}

function parseBannerFeedRecord(value: unknown): BannerFeedRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const banner = value as Record<string, unknown>;
  const pageTargets = parseBannerPageTargets(banner.pageTargets);

  if (
    typeof banner.uuid === 'string' &&
    typeof banner.htmlContent === 'string' &&
    (banner.title === null || typeof banner.title === 'string') &&
    appearances.has(banner.appearance) &&
    icons.has(banner.icon) &&
    typeof banner.dismissible === 'boolean' &&
    audiences.has(banner.audience) &&
    typeof banner.placement === 'string' &&
    pageTargets !== null &&
    typeof banner.priority === 'number' &&
    Number.isFinite(banner.priority) &&
    typeof banner.presentationHash === 'string'
  ) {
    return { ...banner, pageTargets } as BannerFeedRecord;
  }
  return null;
}

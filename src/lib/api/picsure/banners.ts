import { request } from '#lib/api/client.ts';
import type { ArchivedBanner, BannerDraft, ManagedBanner } from '#lib/banners/model/banner.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import { hasBannerContent, sanitizeBannerHTML } from '#lib/banners/model/html.ts';
import { normalizeBannerPageTargets } from '#lib/banners/model/pageTargets.ts';

export async function publishBanner(draft: BannerDraft): Promise<ManagedBanner> {
  return request(Picsure.Banners.Manage, {
    method: 'POST',
    body: authorablePayload(draft),
    auth: 'open',
  });
}

export async function getManagedBanners(): Promise<ManagedBanner[]> {
  return request(Picsure.Banners.Manage, { auth: 'open' });
}

export async function reorderBanners(bannerUuids: string[]): Promise<ManagedBanner[]> {
  return request(PicsurePaths.bannerOrder, { method: 'PUT', body: { bannerUuids }, auth: 'open' });
}

export async function saveBanner(draft: BannerDraft): Promise<ManagedBanner> {
  return request(PicsurePaths.savedBanners, {
    method: 'POST',
    body: authorablePayload(draft),
    auth: 'open',
  });
}

export async function updateSavedBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return request(PicsurePaths.banner(uuid), {
    method: 'PUT',
    body: authorablePayload(draft),
    auth: 'open',
  });
}

export const updatePublishedBanner = updateSavedBanner;

export async function publishSavedBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return request(PicsurePaths.banner(uuid, 'publish'), {
    method: 'POST',
    body: authorablePayload(draft),
    auth: 'open',
  });
}

export async function disableBanner(uuid: string): Promise<ManagedBanner> {
  return request(PicsurePaths.banner(uuid, 'disable'), { method: 'POST', auth: 'open' });
}

export async function archiveBanner(uuid: string): Promise<ArchivedBanner> {
  return request(PicsurePaths.banner(uuid, 'archive'), { method: 'POST', auth: 'open' });
}

export async function restoreBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return request(PicsurePaths.banner(uuid, 'restore'), {
    method: 'POST',
    body: authorablePayload(draft),
    auth: 'open',
  });
}

function authorablePayload(
  draft: BannerDraft,
): Omit<BannerDraft, 'title'> & { title: string | null } {
  const htmlContent = sanitizeBannerHTML(draft.htmlContent);
  if (!hasBannerContent(htmlContent)) {
    throw new Error('Banner content is required');
  }
  if (htmlContent.length > 5_000) {
    throw new Error('Banner content must be 5,000 characters or fewer');
  }
  const title = draft.title.trim();
  if (title.length > 120) {
    throw new Error('Banner title must be 120 characters or fewer');
  }

  return {
    ...draft,
    htmlContent,
    title: title || null,
    pageTargets: normalizeBannerPageTargets(draft.pageTargets),
  };
}

/**
 * The public feed of active banners, unparsed, or undefined when it can't be read. It renders on
 * public pages too, so it goes without credentials, and a failure stays out of the session: no
 * logout, no thrown error, no cached copy.
 */
export function getActiveBanners(): Promise<unknown> {
  return request<unknown>(Picsure.Banners.Active, {
    auth: 'none',
    softFail: true,
    headers: { Accept: 'application/json' },
  });
}

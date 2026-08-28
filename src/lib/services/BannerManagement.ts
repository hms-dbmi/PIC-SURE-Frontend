import * as api from '$lib/api';
import type { ArchivedBanner, BannerDraft, ManagedBanner } from '$lib/models/Banner';
import { Picsure } from '$lib/paths';
import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';
import { normalizeBannerPageTargets } from '$lib/utilities/BannerPageTargets';

export async function publishBanner(draft: BannerDraft): Promise<ManagedBanner> {
  return api.post(Picsure.Banners.Manage, authorablePayload(draft));
}

export async function getManagedBanners(): Promise<ManagedBanner[]> {
  return api.get(Picsure.Banners.Manage);
}

export async function reorderBanners(bannerUuids: string[]): Promise<ManagedBanner[]> {
  return api.put(`${Picsure.Banners.Manage}/order`, { bannerUuids });
}

export async function saveBanner(draft: BannerDraft): Promise<ManagedBanner> {
  return api.post(`${Picsure.Banners.Manage}/saved`, authorablePayload(draft));
}

export async function updateSavedBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return api.put(`${Picsure.Banners.Manage}/${uuid}`, authorablePayload(draft));
}

export async function updatePublishedBanner(
  uuid: string,
  draft: BannerDraft,
): Promise<ManagedBanner> {
  return api.put(`${Picsure.Banners.Manage}/${uuid}`, authorablePayload(draft));
}

export async function publishSavedBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return api.post(`${Picsure.Banners.Manage}/${uuid}/publish`, authorablePayload(draft));
}

export async function disableBanner(uuid: string): Promise<ManagedBanner> {
  return api.post(`${Picsure.Banners.Manage}/${uuid}/disable`, undefined);
}

export async function archiveBanner(uuid: string): Promise<ArchivedBanner> {
  return api.post(`${Picsure.Banners.Manage}/${uuid}/archive`, undefined);
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
  if (draft.title.length > 120) {
    throw new Error('Banner title must be 120 characters or fewer');
  }

  return {
    ...draft,
    htmlContent,
    title: draft.title.trim() || null,
    pageTargets: normalizeBannerPageTargets(draft.pageTargets),
  };
}

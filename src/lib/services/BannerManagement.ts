import * as api from '$lib/api';
import type { BannerDraft, PublishedBanner } from '$lib/models/Banner';
import { Picsure } from '$lib/paths';
import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

export async function publishBanner(draft: BannerDraft): Promise<PublishedBanner> {
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

  return api.post(Picsure.Banners.Manage, {
    ...draft,
    htmlContent,
    title: draft.title.trim() || null,
  });
}

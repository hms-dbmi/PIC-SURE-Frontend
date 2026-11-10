import { request, type RequestOptions } from '#lib/api/client.ts';
import type { ArchivedBanner, BannerDraft, ManagedBanner } from '#lib/banners/model/banner.ts';
import { Picsure, PicsurePaths } from '#lib/api/paths.ts';
import { expectArray, expectRecord, isRecord } from '#lib/api/picsure/guards.ts';
import { hasBannerContent, sanitizeBannerHTML } from '#lib/banners/model/html.ts';
import { normalizeBannerPageTargets } from '#lib/banners/model/pageTargets.ts';

export async function publishBanner(draft: BannerDraft): Promise<ManagedBanner> {
  return banner(Picsure.Banners.Manage, { method: 'POST', body: authorablePayload(draft) });
}

export async function getManagedBanners(): Promise<ManagedBanner[]> {
  return banners(Picsure.Banners.Manage, {});
}

export async function reorderBanners(bannerUuids: string[]): Promise<ManagedBanner[]> {
  return banners(PicsurePaths.bannerOrder, { method: 'PUT', body: { bannerUuids } });
}

export async function saveBanner(draft: BannerDraft): Promise<ManagedBanner> {
  return banner(PicsurePaths.savedBanners, { method: 'POST', body: authorablePayload(draft) });
}

export async function updateSavedBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return banner(PicsurePaths.banner(uuid), { method: 'PUT', body: authorablePayload(draft) });
}

export const updatePublishedBanner = updateSavedBanner;

export async function publishSavedBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return banner(PicsurePaths.banner(uuid, 'publish'), {
    method: 'POST',
    body: authorablePayload(draft),
  });
}

export async function disableBanner(uuid: string): Promise<ManagedBanner> {
  return banner(PicsurePaths.banner(uuid, 'disable'), { method: 'POST' });
}

export async function archiveBanner(uuid: string): Promise<ArchivedBanner> {
  return banner(PicsurePaths.banner(uuid, 'archive'), { method: 'POST' });
}

export async function restoreBanner(uuid: string, draft: BannerDraft): Promise<ManagedBanner> {
  return banner(PicsurePaths.banner(uuid, 'restore'), {
    method: 'POST',
    body: authorablePayload(draft),
  });
}

type ManageOptions = Pick<RequestOptions, 'method' | 'body'>;

async function banner<T extends ManagedBanner | ArchivedBanner>(
  path: string,
  opts: ManageOptions,
): Promise<T> {
  return expectRecord(await request(path, { ...opts, auth: 'open' }), 'banner') as T;
}

async function banners(path: string, opts: ManageOptions): Promise<ManagedBanner[]> {
  const list = expectArray(await request(path, { ...opts, auth: 'open' }), 'banner list');
  if (list.some((entry) => !isRecord(entry))) throw new Error('Invalid banner list response');
  return list as ManagedBanner[];
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
 * The public feed of active banners, unparsed. It renders on public pages too, so it goes without
 * credentials, and a failure stays out of the session: no logout, no cached copy. A failure
 * rejects with its cause (the HTTP status or the network error) for the caller to log.
 */
export async function getActiveBanners(): Promise<unknown> {
  let cause = 'Banner feed request failed';
  // softFail resolves undefined for every failure; watching the fetch keeps the reason
  const watchedFetch: typeof fetch = async (input, init) => {
    try {
      const response = await fetch(input, init);
      if (!response.ok) cause = `Banner feed returned HTTP ${response.status}`;
      return response;
    } catch (error) {
      cause = error instanceof Error ? error.message : String(error);
      throw error;
    }
  };
  const feed = await request<unknown>(Picsure.Banners.Active, {
    auth: 'none',
    softFail: true,
    headers: { Accept: 'application/json' },
    fetch: watchedFetch,
  });
  if (feed === undefined) throw new Error(cause);
  return feed;
}

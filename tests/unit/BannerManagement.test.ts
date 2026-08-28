import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api', () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));

import * as api from '$lib/api';
import {
  archiveBanner,
  disableBanner,
  getManagedBanners,
  publishBanner,
  publishSavedBanner,
  reorderBanners,
  saveBanner,
  updatePublishedBanner,
  updateSavedBanner,
} from '$lib/services/BannerManagement';
import type { BannerDraft, ManagedBanner } from '$lib/models/Banner';

const draft: BannerDraft = {
  htmlContent:
    '<p class="fixed">Maintenance <a href="https://example.org">details</a>' +
    '<img src="https://example.org/x.png"></p>',
  title: '',
  appearance: 'PRIMARY',
  icon: 'NONE',
  dismissible: true,
  audience: 'EVERYONE',
  placement: 'SITE_TOP',
  pageTargets: [{ kind: 'ALL' }],
  startAt: null,
  endAt: null,
};

const published: ManagedBanner = {
  ...draft,
  htmlContent: '<p>Maintenance <a href="https://example.org">details</a></p>',
  title: null,
  uuid: '11111111-1111-1111-1111-111111111111',
  status: 'PUBLISHED',
  lifecycle: 'ACTIVE',
  priority: 1,
  presentationHash: 'abc123',
  startAt: '2026-08-27T12:00:00Z',
  endAt: null,
  createdAt: '2026-08-27T12:00:00Z',
  createdBy: 'admin-id',
  updatedAt: '2026-08-27T12:00:00Z',
  updatedBy: 'admin-id',
  publishedAt: '2026-08-27T12:00:00Z',
  publishedBy: 'admin-id',
  disabledAt: null,
  disabledBy: null,
};

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(api.put).mockReset();
});

describe('draft banner management', () => {
  it('loads non-archived records and uses dedicated save, update, and promotion endpoints', async () => {
    const saved = {
      ...published,
      status: 'SAVED' as const,
      lifecycle: 'SAVED' as const,
      startAt: null,
      priority: null,
      publishedAt: null,
      publishedBy: null,
    };
    vi.mocked(api.get).mockResolvedValue([saved]);
    vi.mocked(api.post).mockResolvedValueOnce(saved).mockResolvedValueOnce(published);
    vi.mocked(api.put).mockResolvedValue(saved);

    await expect(getManagedBanners()).resolves.toEqual([saved]);
    await expect(saveBanner(draft)).resolves.toBe(saved);
    await expect(updateSavedBanner(saved.uuid, draft)).resolves.toBe(saved);
    await expect(publishSavedBanner(saved.uuid, draft)).resolves.toBe(published);

    expect(api.get).toHaveBeenCalledWith('picsure/operations/banners');
    expect(api.post).toHaveBeenNthCalledWith(1, 'picsure/operations/banners/saved', {
      ...draft,
      htmlContent: published.htmlContent,
      title: null,
    });
    expect(api.put).toHaveBeenCalledWith(`picsure/operations/banners/${saved.uuid}`, {
      ...draft,
      htmlContent: published.htmlContent,
      title: null,
    });
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      `picsure/operations/banners/${saved.uuid}/publish`,
      {
        ...draft,
        htmlContent: published.htmlContent,
        title: null,
      },
    );
  });

  it.each([saveBanner, updateSavedBanner.bind(null, 'saved-id')])(
    'applies the authoring validation before draft mutation',
    async (mutate) => {
      await expect(mutate({ ...draft, htmlContent: '<p>&nbsp;</p>' })).rejects.toThrow(
        'Banner content is required',
      );
      expect(api.post).not.toHaveBeenCalled();
      expect(api.put).not.toHaveBeenCalled();
    },
  );
});

describe('updatePublishedBanner', () => {
  it('sanitizes authorable fields and returns the authoritative updated occurrence', async () => {
    const corrected = {
      ...published,
      htmlContent: '<p>Corrected content</p>',
      title: 'Corrected',
      presentationHash: 'corrected-hash',
      updatedAt: '2026-08-27T13:00:00Z',
    };
    vi.mocked(api.put).mockResolvedValue(corrected);

    await expect(
      updatePublishedBanner(published.uuid, {
        ...draft,
        htmlContent: '<p class="removed">Corrected content</p>',
        title: ' Corrected ',
      }),
    ).resolves.toBe(corrected);
    expect(api.put).toHaveBeenCalledWith(`picsure/operations/banners/${published.uuid}`, {
      ...draft,
      htmlContent: '<p>Corrected content</p>',
      title: 'Corrected',
    });
  });
});

describe('reorderBanners', () => {
  it('submits the complete queue to the atomic order endpoint and returns its authoritative order', async () => {
    const authoritative = [{ ...published, priority: 1 }];
    vi.mocked(api.put).mockResolvedValue(authoritative);

    await expect(reorderBanners([published.uuid])).resolves.toBe(authoritative);

    expect(api.put).toHaveBeenCalledWith('picsure/operations/banners/order', {
      bannerUuids: [published.uuid],
    });
  });
});

describe('disableBanner', () => {
  it('posts to the dedicated disable route without a body and returns the authoritative record', async () => {
    const disabled = {
      ...published,
      status: 'DISABLED' as const,
      lifecycle: 'DISABLED' as const,
      updatedAt: '2026-08-27T13:00:00Z',
      updatedBy: 'super-id',
      disabledAt: '2026-08-27T13:00:00Z',
      disabledBy: 'super-id',
    };
    vi.mocked(api.post).mockResolvedValue(disabled);

    await expect(disableBanner(published.uuid)).resolves.toBe(disabled);
    expect(api.post).toHaveBeenCalledWith(
      `picsure/operations/banners/${published.uuid}/disable`,
      undefined,
    );
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe('archiveBanner', () => {
  it('posts to the dedicated archive route without a body and returns the authoritative result', async () => {
    const archived = {
      uuid: published.uuid,
      status: 'ARCHIVED' as const,
      archivedAt: '2026-08-28T13:00:00Z',
      archivedBy: 'super-id',
    };
    vi.mocked(api.post).mockResolvedValue(archived);

    await expect(archiveBanner(published.uuid)).resolves.toBe(archived);
    expect(api.post).toHaveBeenCalledWith(
      `picsure/operations/banners/${published.uuid}/archive`,
      undefined,
    );
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe('publishBanner', () => {
  it('sanitizes before save, sends only authorable fields, and returns the authoritative record', async () => {
    vi.mocked(api.post).mockResolvedValue(published);

    await expect(publishBanner(draft)).resolves.toBe(published);
    expect(api.post).toHaveBeenCalledWith('picsure/operations/banners', {
      ...draft,
      htmlContent: published.htmlContent,
      title: null,
    });
  });

  it('rejects sanitized HTML over 5,000 characters before calling the API', async () => {
    await expect(
      publishBanner({ ...draft, htmlContent: `<p>${'x'.repeat(5_001)}</p>` }),
    ).rejects.toThrow('Banner content must be 5,000 characters or fewer');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rejects a title over 120 characters before calling the API', async () => {
    await expect(publishBanner({ ...draft, title: 'x'.repeat(121) })).rejects.toThrow(
      'Banner title must be 120 characters or fewer',
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it.each(['<p></p>', '<p> \n</p>', '<p>&nbsp;</p>'])(
    'rejects semantically blank banner content before calling the API: %s',
    async (htmlContent) => {
      await expect(publishBanner({ ...draft, htmlContent })).rejects.toThrow(
        'Banner content is required',
      );
      expect(api.post).not.toHaveBeenCalled();
    },
  );
});

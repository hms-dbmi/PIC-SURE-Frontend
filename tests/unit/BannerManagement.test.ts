import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/api', () => ({ post: vi.fn() }));

import * as api from '$lib/api';
import { publishBanner } from '$lib/services/BannerManagement';
import type { BannerDraft, PublishedBanner } from '$lib/models/Banner';

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
};

const published: PublishedBanner = {
  ...draft,
  htmlContent: '<p>Maintenance <a href="https://example.org">details</a></p>',
  title: null,
  uuid: '11111111-1111-1111-1111-111111111111',
  status: 'PUBLISHED',
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
};

beforeEach(() => {
  vi.mocked(api.post).mockReset();
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
});

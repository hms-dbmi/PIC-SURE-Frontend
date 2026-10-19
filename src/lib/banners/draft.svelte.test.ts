import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/api/picsure/banners.ts', () => ({
  publishBanner: vi.fn(),
  publishSavedBanner: vi.fn(),
  restoreBanner: vi.fn(),
  saveBanner: vi.fn(),
  updatePublishedBanner: vi.fn(),
  updateSavedBanner: vi.fn(),
}));

import { BannerDraftForm } from '#lib/banners/draft.svelte.ts';
import type { ManagedBanner } from '#lib/banners/model/banner.ts';
import { restoreBanner, saveBanner, updateSavedBanner } from '#lib/api/picsure/banners.ts';
import { toaster } from '#lib/ui/toaster.ts';

const saved: ManagedBanner = {
  uuid: '99999999-9999-9999-9999-999999999999',
  htmlContent: '<p>Saved content</p>',
  title: 'Saved title',
  appearance: 'WARNING',
  icon: 'WARNING',
  dismissible: false,
  audience: 'EVERYONE',
  placement: 'SITE_TOP',
  pageTargets: [{ kind: 'EXACT', path: '/help' }],
  priority: null,
  presentationHash: 'server-hash',
  status: 'SAVED',
  lifecycle: 'SAVED',
  startAt: null,
  endAt: null,
  createdAt: '2026-08-27T12:00:00Z',
  createdBy: 'admin-id',
  updatedAt: '2026-08-27T12:00:00Z',
  updatedBy: 'admin-id',
  publishedAt: null,
  publishedBy: null,
  disabledAt: null,
  disabledBy: null,
  restoredFromUuid: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BannerDraftForm', () => {
  it('starts a new banner clean and unsavable, and becomes savable once it has content', () => {
    const form = new BannerDraftForm(null, undefined, 'UTC');
    expect(form.mode).toBe('create');
    expect(form.dirty).toBe(false);
    expect(form.canSave).toBe(false);

    form.htmlContent = '<p>Maintenance tonight</p>';

    expect(form.dirty).toBe(true);
    expect(form.canSave).toBe(true);
    expect(form.canPublish).toBe(true);
  });

  it('blocks saving and publishing content over the limit', () => {
    const form = new BannerDraftForm(null, undefined, 'UTC');
    form.htmlContent = `<p>${'x'.repeat(5_000)}</p>`;

    expect(form.contentTooLong).toBe(true);
    expect(form.canSave).toBe(false);
    expect(form.canPublish).toBe(false);
  });

  it('is clean again after the edit is undone', () => {
    const form = new BannerDraftForm(saved, undefined, 'UTC');
    form.title = 'Changed';
    expect(form.dirty).toBe(true);

    form.title = 'Saved title';
    expect(form.dirty).toBe(false);
  });

  it('adopts the server copy of the page targets so a saved edit is clean', async () => {
    vi.mocked(updateSavedBanner).mockResolvedValue({
      ...saved,
      pageTargets: [{ kind: 'EXACT', path: '/help' }],
    });
    const form = new BannerDraftForm(saved, undefined, 'UTC');
    form.pageTargets = [{ kind: 'EXACT', path: ' /help/ ' }];

    const result = await form.save();

    expect(result?.uuid).toBe(saved.uuid);
    expect(form.pageTargets).toEqual([{ kind: 'EXACT', path: '/help' }]);
    expect(form.dirty).toBe(false);
    expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner changes saved' });
  });

  it('keeps the edit and reports a failed save', async () => {
    vi.mocked(saveBanner).mockRejectedValue(new Error('offline'));
    const form = new BannerDraftForm(null, undefined, 'UTC');
    form.htmlContent = '<p>Maintenance tonight</p>';

    expect(await form.save()).toBeUndefined();

    expect(form.dirty).toBe(true);
    expect(form.working).toBeNull();
    expect(toaster.error).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Banner could not be saved' }),
    );
  });

  it('restores a copy without its schedule and counts it as unsaved from the start', () => {
    const form = new BannerDraftForm(
      { ...saved, status: 'DISABLED', lifecycle: 'DISABLED', startAt: '2026-08-27T12:00:00Z' },
      'restore',
      'UTC',
    );

    expect(form.dirty).toBe(true);
    expect(form.startLocal).toBe('');
    expect(form.publishCopy.submitLabel).toBe('Restore');
  });

  it('refuses a restore start that has already passed without calling the API', async () => {
    const form = new BannerDraftForm(saved, 'restore', 'UTC');
    form.startLocal = '2020-01-01T00:00';

    expect(form.restoreStartNotFuture).toBe(true);
    expect(await form.publish()).toBeUndefined();
    expect(restoreBanner).not.toHaveBeenCalled();
  });
});

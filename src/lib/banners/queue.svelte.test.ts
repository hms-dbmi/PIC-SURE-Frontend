import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/api/picsure/banners.ts', () => ({
  archiveBanner: vi.fn(),
  disableBanner: vi.fn(),
  getManagedBanners: vi.fn(),
  reorderBanners: vi.fn(),
}));

import { BannerQueue } from '#lib/banners/queue.svelte.ts';
import type { ManagedBanner } from '#lib/banners/model/banner.ts';
import { disableBanner, getManagedBanners, reorderBanners } from '#lib/api/picsure/banners.ts';
import { toaster } from '#lib/ui/toaster.ts';

function published(uuid: string, priority: number, text: string): ManagedBanner {
  return {
    uuid,
    htmlContent: `<p>${text}</p>`,
    title: null,
    appearance: 'PRIMARY',
    icon: 'NONE',
    dismissible: true,
    audience: 'EVERYONE',
    placement: 'SITE_TOP',
    pageTargets: [{ kind: 'ALL' }],
    priority,
    presentationHash: `hash-${uuid}`,
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
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
    restoredFromUuid: null,
  };
}

const first = published('a', 1, 'Maintenance');
const second = published('b', 2, 'New dataset');

async function loadedQueue() {
  vi.mocked(getManagedBanners).mockResolvedValueOnce([first, second]);
  const queue = new BannerQueue();
  await queue.load();
  return queue;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('BannerQueue', () => {
  it('loads the banners in publishing order', async () => {
    const queue = await loadedQueue();

    expect(queue.loading).toBe(false);
    expect(queue.orderUuids).toEqual(['a', 'b']);
    expect(queue.visible.map((banner) => banner.uuid)).toEqual(['a', 'b']);
    expect(queue.orderDirty).toBe(false);
  });

  it('reports a failed load', async () => {
    vi.mocked(getManagedBanners).mockRejectedValueOnce(new Error('offline'));
    const queue = new BannerQueue();
    await queue.load();

    expect(queue.failed).toBe(true);
    expect(queue.loading).toBe(false);
  });

  it('filters the visible rows by search and stops ordering while searching', async () => {
    const queue = await loadedQueue();
    queue.search = 'dataset';

    expect(queue.visible.map((banner) => banner.uuid)).toEqual(['b']);
    expect(queue.ordering).toBe(false);
  });

  it('tracks an edited order until it is discarded', async () => {
    const queue = await loadedQueue();
    queue.orderUuids = ['b', 'a'];
    expect(queue.orderDirty).toBe(true);

    queue.discardOrderChanges();

    expect(queue.orderUuids).toEqual(['a', 'b']);
    expect(queue.orderDirty).toBe(false);
  });

  it('keeps the committed order when the refetch after saving it fails', async () => {
    const queue = await loadedQueue();
    queue.orderUuids = ['b', 'a'];
    vi.mocked(reorderBanners).mockResolvedValueOnce([
      { ...second, priority: 1 },
      { ...first, priority: 2 },
    ]);
    vi.mocked(getManagedBanners).mockRejectedValueOnce(new Error('offline'));

    await queue.saveOrder();

    expect(reorderBanners).toHaveBeenCalledWith(['b', 'a']);
    expect(queue.savedOrderUuids).toEqual(['b', 'a']);
    expect(queue.orderDirty).toBe(false);
    expect(queue.savingOrder).toBe(false);
    expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner order saved' });
  });

  it('moves a disabled banner out of the order and resolves it', async () => {
    const queue = await loadedQueue();
    const disabled = { ...first, status: 'DISABLED' as const, lifecycle: 'DISABLED' as const };
    vi.mocked(disableBanner).mockResolvedValueOnce(disabled);

    expect(await queue.disable('a')).toEqual(disabled);

    expect(queue.orderUuids).toEqual(['b']);
    expect(queue.counts).toEqual({ orderable: 1, saved: 1, expired: 0 });
    expect(queue.disablingUuid).toBeNull();
  });

  it('shows the tab a saved banner lands in and clears the search', async () => {
    const queue = await loadedQueue();
    queue.search = 'dataset';
    const draft = {
      ...published('c', 0, 'Draft'),
      status: 'SAVED' as const,
      lifecycle: 'SAVED' as const,
      priority: null,
    };

    queue.adopt(draft);

    expect(queue.tab).toBe('saved');
    expect(queue.search).toBe('');
    expect(queue.visible.map((banner) => banner.uuid)).toEqual(['c']);
  });
});

// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

const navigation = vi.hoisted(() => ({
  callback: undefined as (() => Promise<void>) | undefined,
}));

vi.mock('$app/navigation', () => ({
  afterNavigate: (callback: () => Promise<void>) => {
    navigation.callback = callback;
  },
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args: unknown[]) => args),
}));

import SiteBannerRegion from '$lib/components/banner/SiteBannerRegion.svelte';
import { createLog, log } from '$lib/logger';

const banner = {
  uuid: '11111111-1111-1111-1111-111111111111',
  htmlContent: '<p>Scheduled maintenance <a href="/help">details</a></p>',
  title: 'Maintenance',
  appearance: 'PRIMARY',
  icon: 'INFORMATION',
  dismissible: true,
  audience: 'EVERYONE',
  placement: 'SITE_TOP',
  pageTargets: [{ kind: 'ALL' }],
  priority: 10,
  presentationHash: 'abc123',
};

const fetchMock = vi.fn();

beforeEach(() => {
  navigation.callback = undefined;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(log).mockClear();
  vi.mocked(createLog).mockClear();
});

describe('SiteBannerRegion', () => {
  it('fetches on initial navigation and each following SvelteKit navigation', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner]), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(fetchMock).toHaveBeenCalledWith('/picsure/operations/banners/active', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    expect(screen.getByTestId('site-banner-region')).toHaveClass('w-full');
    expect(screen.getByRole('region', { name: 'Maintenance' })).toHaveTextContent(
      'Scheduled maintenance details',
    );

    await navigation.callback?.();

    await waitFor(() => expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the returned priority order and omits non-site-top placements', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          banner,
          {
            ...banner,
            uuid: '22222222-2222-2222-2222-222222222222',
            title: 'Second',
            priority: 20,
          },
          {
            ...banner,
            uuid: '33333333-3333-3333-3333-333333333333',
            title: 'Different placement',
            placement: 'PAGE_INLINE',
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(
      screen.getAllByTestId('site-banner').map((element) => element.getAttribute('aria-label')),
    ).toEqual(['Maintenance', 'Second']);
  });

  it('renders no container or gap for an empty feed', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
  });

  it('records a failed feed and leaves rendering and later navigation available', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(createLog).toHaveBeenCalledWith(
      'ERROR',
      'banner.feed_failed',
      undefined,
      expect.objectContaining({ error: { message: 'offline' } }),
    );
    expect(log).toHaveBeenCalledOnce();

    await navigation.callback?.();

    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
  });
});

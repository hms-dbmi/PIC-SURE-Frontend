// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const navigation = vi.hoisted(() => ({
  callback: undefined as ((navigation?: { to?: { url: URL } | null }) => Promise<void>) | undefined,
}));
const authentication = vi.hoisted(() => ({
  setHasValidToken: undefined as unknown as (value: boolean) => void,
  setTokenStatus: undefined as unknown as (value: boolean) => void,
}));

vi.mock('$app/navigation', () => ({
  afterNavigate: (callback: (navigation?: { to?: { url: URL } | null }) => Promise<void>) => {
    navigation.callback = callback;
  },
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn((...args: unknown[]) => args),
}));

// Keep token presence separate from validity to cover expired sessions on public routes.
vi.mock('$lib/stores/User', async () => {
  const { writable } = await import('svelte/store');
  const hasValidToken = writable(false);
  const tokenStatus = writable(false);
  authentication.setHasValidToken = (value) => hasValidToken.set(value);
  authentication.setTokenStatus = (value) => tokenStatus.set(value);
  return { hasValidToken, tokenStatus };
});

import SiteBannerRegion from '$lib/components/banner/SiteBannerRegion.svelte';
import { createLog, log } from '$lib/logger';
import type { BannerAudience } from '$lib/models/Banner';

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
const dismissalStorageKey = 'site-banner-dismissals-v1';

function without(field: string): Record<string, unknown> {
  const malformed: Record<string, unknown> = { ...banner };
  delete malformed[field];
  return malformed;
}

beforeEach(() => {
  navigation.callback = undefined;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(log).mockClear();
  vi.mocked(createLog).mockClear();
  authentication.setHasValidToken(false);
  authentication.setTokenStatus(false);
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SiteBannerRegion', () => {
  it('fetches on initial navigation and each following SvelteKit navigation', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner]), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(fetchMock).toHaveBeenCalledWith('/picsure/operations/banners/active/v2', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    expect(screen.getByTestId('site-banner-region')).toHaveClass('w-full');
    const notice = screen.getByRole('region', { name: 'Maintenance' });
    expect(notice.tagName).toBe('SECTION');
    expect(notice).toHaveTextContent('Scheduled maintenance details');
    expect(createLog).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();

    await navigation.callback?.();

    await waitFor(() => expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(createLog).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('keeps the server order even when priorities are not ascending', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            ...banner,
            uuid: '22222222-2222-2222-2222-222222222222',
            title: 'First from server',
            priority: 20,
          },
          {
            ...banner,
            uuid: '33333333-3333-3333-3333-333333333333',
            title: 'Second from server',
            priority: 10,
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(
      screen.getAllByTestId('site-banner').map((element) => element.getAttribute('aria-label')),
    ).toEqual(['First from server', 'Second from server']);
  });

  it('retains valid records in server order when another record is malformed', async () => {
    const secondBanner = {
      ...banner,
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Second valid banner',
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([banner, { ...banner, appearance: 'NEON' }, secondBanner]), {
        status: 200,
      }),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(
      screen.getAllByTestId('site-banner').map((element) => element.getAttribute('aria-label')),
    ).toEqual(['Maintenance', 'Second valid banner']);
    expect(createLog).toHaveBeenCalledWith('ERROR', 'banner.feed_malformed_records', {
      malformedRecords: 1,
    });
    expect(log).toHaveBeenCalledOnce();
    expect(JSON.stringify(vi.mocked(createLog).mock.calls)).not.toContain('Scheduled maintenance');
  });

  it('skips an unsupported future placement without discarding a site-top banner', async () => {
    const inlineBanner = {
      ...banner,
      uuid: '44444444-4444-4444-4444-444444444444',
      title: 'Future inline announcement',
      placement: 'PAGE_INLINE',
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([inlineBanner, banner]), { status: 200 }),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Future inline announcement' }),
    ).not.toBeInTheDocument();
    expect(createLog).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    ['missing appearance', without('appearance')],
    ['unknown appearance', { ...banner, appearance: 'NEON' }],
    ['missing icon', without('icon')],
    ['unknown icon', { ...banner, icon: 'BELL' }],
    ['missing uuid', without('uuid')],
    ['missing html', without('htmlContent')],
    ['missing placement', without('placement')],
    ['malformed page targets', { ...banner, pageTargets: [{ kind: 'EXACT' }] }],
    ['nonnumeric priority', { ...banner, priority: 'first' }],
  ])(
    'skips %s and clears the region when no valid record remains',
    async (_description, malformed) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner]), { status: 200 }));
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([malformed]), { status: 200 }));
      render(SiteBannerRegion);

      await navigation.callback?.();
      expect(screen.getByTestId('site-banner-region')).toBeInTheDocument();

      await navigation.callback?.();

      expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
      expect(createLog).toHaveBeenCalledWith('ERROR', 'banner.feed_malformed_records', {
        malformedRecords: 1,
      });
      expect(log).toHaveBeenCalledOnce();
    },
  );

  it('emits one skip diagnostic when every record is invalid', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([without('uuid'), { ...banner, icon: 'BELL' }]), {
        status: 200,
      }),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(createLog).toHaveBeenCalledWith('ERROR', 'banner.feed_malformed_records', {
      malformedRecords: 2,
    });
    expect(log).toHaveBeenCalledOnce();
  });

  it('treats a non-array response as a feed failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner]), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ banner }), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();
    expect(screen.getByTestId('site-banner-region')).toBeInTheDocument();

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(createLog).toHaveBeenCalledWith(
      'ERROR',
      'banner.feed_failed',
      undefined,
      expect.objectContaining({
        error: { message: 'Banner feed returned an invalid response' },
      }),
    );
    expect(log).toHaveBeenCalledOnce();
  });

  it('renders no container or gap for an empty feed', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(createLog).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
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

  it('fails safely without banners when an old backend does not have the versioned feed', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 404 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(createLog).toHaveBeenCalledWith(
      'ERROR',
      'banner.feed_failed',
      undefined,
      expect.objectContaining({ error: { message: 'Banner feed returned HTTP 404' } }),
    );
    expect(log).toHaveBeenCalledOnce();
  });

  it('hides a matching dismissible occurrence while permanent banners ignore storage', async () => {
    const permanent = {
      ...banner,
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Permanent notice',
      dismissible: false,
      presentationHash: 'permanent-hash',
    };
    sessionStorage.setItem(
      dismissalStorageKey,
      JSON.stringify({
        [banner.uuid]: banner.presentationHash,
        [permanent.uuid]: permanent.presentationHash,
      }),
    );
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, permanent]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.queryByRole('region', { name: 'Maintenance' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Permanent notice' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Dismiss Permanent notice/ }),
    ).not.toBeInTheDocument();
  });

  it('dismisses only the selected occurrence and writes the complete versioned map', async () => {
    const second = {
      ...banner,
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Second notice',
      presentationHash: 'second-hash',
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, second]), { status: 200 }));
    render(SiteBannerRegion);
    await navigation.callback?.();

    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Maintenance' }));

    expect(screen.queryByRole('region', { name: 'Maintenance' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Second notice' })).toBeInTheDocument();
    expect(sessionStorage.getItem(dismissalStorageKey)).toBe(
      JSON.stringify({ [banner.uuid]: banner.presentationHash }),
    );
  });

  it('keeps the same hash dismissed across navigation and priority changes, then shows a new hash', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner]), { status: 200 }));
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ ...banner, priority: 99 }]), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ ...banner, priority: 99, presentationHash: 'changed-hash' }]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);
    await navigation.callback?.();
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Maintenance' }));

    await navigation.callback?.({ to: { url: new URL('https://picsure.example/help') } });
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();

    await navigation.callback?.({ to: { url: new URL('https://picsure.example/status') } });
    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
  });

  it('shows a changed hash only when its signed-in audience and parameterized page also match', async () => {
    authentication.setHasValidToken(true);
    authentication.setTokenStatus(true);
    const targeted = {
      ...banner,
      audience: 'SIGNED_IN',
      pageTargets: [{ kind: 'PARAMETERIZED', path: '/admin/[section]' }],
      presentationHash: 'targeted-hash-v1',
    };
    const changedHash = { ...targeted, presentationHash: 'targeted-hash-v2' };
    sessionStorage.setItem(
      dismissalStorageKey,
      JSON.stringify({ [targeted.uuid]: targeted.presentationHash }),
    );
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([targeted]), { status: 200 }));
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ ...changedHash, audience: 'SIGNED_OUT' }]), { status: 200 }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ ...changedHash, pageTargets: [{ kind: 'EXACT', path: '/help' }] }]),
        { status: 200 },
      ),
    );
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([changedHash]), { status: 200 }));
    render(SiteBannerRegion);
    const matchingPage = { to: { url: new URL('https://picsure.example/admin/users') } };

    await navigation.callback?.(matchingPage);
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();

    await navigation.callback?.(matchingPage);
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();

    await navigation.callback?.(matchingPage);
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();

    await navigation.callback?.(matchingPage);
    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('restores dismissal from storage after the region remounts', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner]), { status: 200 }));
    render(SiteBannerRegion);
    await navigation.callback?.();
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Maintenance' }));

    cleanup();
    render(SiteBannerRegion);
    await navigation.callback?.();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
  });

  it('renders again when a new tab session has no dismissal map', async () => {
    sessionStorage.setItem(
      dismissalStorageKey,
      JSON.stringify({ [banner.uuid]: banner.presentationHash }),
    );
    sessionStorage.clear();
    expect(sessionStorage.getItem(dismissalStorageKey)).toBeNull();
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
  });

  it('fails open when stored dismissal data is malformed', async () => {
    sessionStorage.setItem(dismissalStorageKey, '{not-json');
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
  });

  it('ignores non-string dismissal entries without discarding valid entries', async () => {
    const second = {
      ...banner,
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Second notice',
      presentationHash: 'second-hash',
    };
    sessionStorage.setItem(
      dismissalStorageKey,
      JSON.stringify({ [banner.uuid]: 123, [second.uuid]: second.presentationHash }),
    );
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, second]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Second notice' })).not.toBeInTheDocument();
  });

  it('fails open when storage cannot be read and keeps the clicked banner hidden when storage cannot be written', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    try {
      fetchMock.mockResolvedValue(new Response(JSON.stringify([banner]), { status: 200 }));
      render(SiteBannerRegion);
      await navigation.callback?.();
      expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
    }

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    try {
      await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Maintenance' }));
      expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    } finally {
      setItem.mockRestore();
    }
  });
});

const audienceCases: [BannerAudience, boolean, boolean][] = [
  ['EVERYONE', true, true],
  ['EVERYONE', false, true],
  ['SIGNED_IN', true, true],
  ['SIGNED_IN', false, false],
  ['SIGNED_OUT', true, false],
  ['SIGNED_OUT', false, true],
];

describe('SiteBannerRegion audience targeting', () => {
  it.each(audienceCases)(
    'renders %s when signed in is %s: %s',
    async (audience, signedIn, rendered) => {
      authentication.setHasValidToken(signedIn);
      authentication.setTokenStatus(signedIn);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify([{ ...banner, audience }]), { status: 200 }),
      );
      render(SiteBannerRegion);

      await navigation.callback?.();

      if (rendered) {
        expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
      }
      expect(log).not.toHaveBeenCalled();
    },
  );

  it('keeps the server order of the matching records and drops only the mismatches', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { ...banner, uuid: '22222222-2222-2222-2222-222222222222', title: 'For everyone' },
          {
            ...banner,
            uuid: '33333333-3333-3333-3333-333333333333',
            title: 'For signed-in users',
            audience: 'SIGNED_IN',
          },
          {
            ...banner,
            uuid: '44444444-4444-4444-4444-444444444444',
            title: 'For signed-out visitors',
            audience: 'SIGNED_OUT',
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(
      screen.getAllByTestId('site-banner').map((element) => element.getAttribute('aria-label')),
    ).toEqual(['For everyone', 'For signed-out visitors']);
    expect(log).not.toHaveBeenCalled();
  });

  it('composes page and audience matching without changing server order', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            ...banner,
            uuid: '22222222-2222-2222-2222-222222222222',
            title: 'First matching page',
            pageTargets: [{ kind: 'SUBTREE', path: '/admin' }],
          },
          {
            ...banner,
            uuid: '33333333-3333-3333-3333-333333333333',
            title: 'Wrong audience',
            audience: 'SIGNED_IN',
            pageTargets: [{ kind: 'PARAMETERIZED', path: '/admin/[section]' }],
          },
          {
            ...banner,
            uuid: '44444444-4444-4444-4444-444444444444',
            title: 'Wrong page',
            audience: 'SIGNED_OUT',
            pageTargets: [{ kind: 'EXACT', path: '/help' }],
          },
          {
            ...banner,
            uuid: '55555555-5555-5555-5555-555555555555',
            title: 'Second matching page',
            audience: 'SIGNED_OUT',
            pageTargets: [{ kind: 'PARAMETERIZED', path: '/admin/[section]' }],
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.({ to: { url: new URL('https://picsure.example/admin/users') } });

    expect(
      screen.getAllByTestId('site-banner').map((element) => element.getAttribute('aria-label')),
    ).toEqual(['First matching page', 'Second matching page']);
  });

  it('accepts and normalizes well-formed noncanonical targets from the versioned feed', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            ...banner,
            pageTargets: [
              { kind: 'SUBTREE', path: '/admin/' },
              { kind: 'EXACT', path: '/admin/users' },
              { kind: 'EXACT', path: '/admin/users' },
            ],
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.({ to: { url: new URL('https://picsure.example/admin/users') } });

    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();
    expect(createLog).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('uses the new pathname on each SvelteKit navigation', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([{ ...banner, pageTargets: [{ kind: 'EXACT', path: '/help' }] }]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.({ to: { url: new URL('https://picsure.example/help?topic=one') } });
    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument();

    await navigation.callback?.({ to: { url: new URL('https://picsure.example/status#notice') } });
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps filtering the same records after a later navigation', async () => {
    authentication.setHasValidToken(true);
    authentication.setTokenStatus(true);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ ...banner, audience: 'SIGNED_OUT' }]), { status: 200 }),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();
    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();

    await navigation.callback?.();

    expect(screen.queryByTestId('site-banner-region')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('re-evaluates the rendered records when the session ends without refetching', async () => {
    authentication.setHasValidToken(true);
    authentication.setTokenStatus(true);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { ...banner, title: 'For signed-in users', audience: 'SIGNED_IN' },
          {
            ...banner,
            uuid: '55555555-5555-5555-5555-555555555555',
            title: 'For signed-out visitors',
            audience: 'SIGNED_OUT',
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();
    expect(screen.getByRole('region', { name: 'For signed-in users' })).toBeInTheDocument();

    authentication.setHasValidToken(false);
    authentication.setTokenStatus(false);

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'For signed-out visitors' })).toBeInTheDocument(),
    );
    expect(screen.queryByRole('region', { name: 'For signed-in users' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('treats a present but expired token as signed out', async () => {
    authentication.setTokenStatus(true);
    authentication.setHasValidToken(false);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { ...banner, title: 'For signed-in users', audience: 'SIGNED_IN' },
          {
            ...banner,
            uuid: '66666666-6666-6666-6666-666666666666',
            title: 'For signed-out visitors',
            audience: 'SIGNED_OUT',
          },
        ]),
        { status: 200 },
      ),
    );
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('region', { name: 'For signed-out visitors' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'For signed-in users' })).not.toBeInTheDocument();
  });
});

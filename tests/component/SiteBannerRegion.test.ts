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

    expect(fetchMock).toHaveBeenCalledWith('/picsure/operations/banners/active', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    expect(screen.getByTestId('site-banner-region')).toHaveClass('w-full');
    const notice = screen.getByRole('article', { name: 'Maintenance' });
    expect(notice.tagName).toBe('ARTICLE');
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

    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
    expect(
      screen.queryByRole('article', { name: 'Future inline announcement' }),
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

    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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

    expect(screen.queryByRole('article', { name: 'Maintenance' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Permanent notice' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Dismiss Permanent notice/ }),
    ).not.toBeInTheDocument();
  });

  it('does not apply a dismissed source occurrence to a restored occurrence with the same hash', async () => {
    const restored = {
      ...banner,
      uuid: '22222222-2222-2222-2222-222222222222',
      title: 'Restored maintenance',
    };
    sessionStorage.setItem(
      dismissalStorageKey,
      JSON.stringify({ [banner.uuid]: banner.presentationHash }),
    );
    fetchMock.mockResolvedValue(new Response(JSON.stringify([restored]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('article', { name: 'Restored maintenance' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Dismiss Restored maintenance' }),
    ).toBeInTheDocument();
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

    expect(screen.queryByRole('article', { name: 'Maintenance' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Second notice' })).toBeInTheDocument();
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
    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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
    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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

    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
  });

  it('fails open when stored dismissal data is malformed', async () => {
    sessionStorage.setItem(dismissalStorageKey, '{not-json');
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner]), { status: 200 }));
    render(SiteBannerRegion);

    await navigation.callback?.();

    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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

    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Second notice' })).not.toBeInTheDocument();
  });

  it('fails open when storage cannot be read and keeps the clicked banner hidden when storage cannot be written', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    try {
      fetchMock.mockResolvedValue(new Response(JSON.stringify([banner]), { status: 200 }));
      render(SiteBannerRegion);
      await navigation.callback?.();
      expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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
        expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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

    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
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
    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();

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
    expect(screen.getByRole('article', { name: 'For signed-in users' })).toBeInTheDocument();

    authentication.setHasValidToken(false);
    authentication.setTokenStatus(false);

    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'For signed-out visitors' })).toBeInTheDocument(),
    );
    expect(screen.queryByRole('article', { name: 'For signed-in users' })).not.toBeInTheDocument();
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

    expect(screen.getByRole('article', { name: 'For signed-out visitors' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'For signed-in users' })).not.toBeInTheDocument();
  });
});

describe('banner feed navigation races', () => {
  it.each(['response', 'failure'] as const)(
    'keeps the latest feed when an older request finishes with a %s',
    async (outcome) => {
      let resolveOld!: (response: Response) => void;
      let rejectOld!: (error: Error) => void;
      fetchMock.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve, reject) => {
            resolveOld = resolve;
            rejectOld = reject;
          }),
      );
      const latest = { ...banner, title: 'Latest notice' };
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([latest])));
      render(SiteBannerRegion);
      const oldRequest = navigation.callback?.({
        to: { url: new URL('https://example.test/old') },
      });
      await navigation.callback?.({ to: { url: new URL('https://example.test/new') } });
      await waitFor(() =>
        expect(screen.getByRole('article', { name: 'Latest notice' })).toBeInTheDocument(),
      );
      if (outcome === 'failure') rejectOld(new Error('old request failed'));
      else resolveOld(new Response(JSON.stringify([banner])));
      await oldRequest;
      expect(screen.getByRole('article', { name: 'Latest notice' })).toBeInTheDocument();
      expect(screen.queryByRole('article', { name: 'Maintenance' })).not.toBeInTheDocument();
      expect(log).not.toHaveBeenCalled();
    },
  );

  it('ignores failures after the region unmounts', async () => {
    let rejectRequest!: (error: Error) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((_, reject) => {
          rejectRequest = reject;
        }),
    );
    const { unmount } = render(SiteBannerRegion);
    const request = navigation.callback?.();
    unmount();
    rejectRequest(new Error('request failed after unmount'));
    await request;
    expect(log).not.toHaveBeenCalled();
  });

  it('groups multiple announcements under one named region', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([banner, { ...banner, uuid: 'other', title: 'Second notice' }])),
    );
    render(SiteBannerRegion);
    await navigation.callback?.();
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Site announcements' })).toBeInTheDocument();
  });
});

describe('public banner accessibility', () => {
  const secondBanner = { ...banner, uuid: 'second', title: 'Service update' };

  it('moves keyboard dismissal focus to the next control, then a persistent fallback', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, secondBanner])));
    render(SiteBannerRegion);
    await navigation.callback?.();

    const first = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    first.focus();
    await fireEvent.click(first, { detail: 0 });
    const second = screen.getByRole('button', { name: 'Dismiss Service update' });
    expect(second).toHaveFocus();

    await fireEvent.click(second, { detail: 0 });
    await waitFor(() => expect(screen.getByText('End of site announcements.')).toHaveFocus());
    expect(document.activeElement).not.toBe(document.body);
  });

  it('moves focus to the previous control when dismissing the final banner in the list', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, secondBanner])));
    render(SiteBannerRegion);
    await navigation.callback?.();
    const second = screen.getByRole('button', { name: 'Dismiss Service update' });
    second.focus();
    await fireEvent.click(second, { detail: 0 });
    expect(screen.getByRole('button', { name: 'Dismiss Maintenance' })).toHaveFocus();
  });

  it.each([0, 1])(
    'does not move unrelated focus when dismissal has click detail %s',
    async (detail) => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, secondBanner])));
      render(SiteBannerRegion);
      await navigation.callback?.();
      const other = screen.getAllByRole('link', { name: 'details' })[0];
      const second = screen.getByRole('button', { name: 'Dismiss Service update' });
      other.focus();
      await fireEvent.click(second, { detail });
      expect(other).toHaveFocus();
    },
  );

  it('does not transfer focus after a pointer dismissal', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, secondBanner])));
    render(SiteBannerRegion);
    await navigation.callback?.();
    const first = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    first.focus();
    await fireEvent.click(first, { detail: 1 });
    expect(screen.getByRole('button', { name: 'Dismiss Service update' })).not.toHaveFocus();
  });

  it('does not reclaim focus moved by another handler before dismissal finishes', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner, secondBanner])));
    render(SiteBannerRegion);
    await navigation.callback?.();
    const first = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    const other = screen.getByRole('button', { name: 'Dismiss Service update' });
    first.focus();
    first.addEventListener('click', () => other.focus());
    await fireEvent.click(first, { detail: 0 });
    expect(other).toHaveFocus();
  });

  it('does not focus a removed fallback when the region unmounts during dismissal', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner])));
    const { container, unmount } = render(SiteBannerRegion);
    await navigation.callback?.();
    const button = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    const fallback = container.querySelector<HTMLParagraphElement>('[tabindex="-1"]')!;
    const focus = vi.spyOn(fallback, 'focus');
    button.focus();
    const dismissing = fireEvent.click(button, { detail: 0 });
    unmount();
    await dismissing;
    expect(focus).not.toHaveBeenCalled();
  });

  it('announces new and changed visible banners without repeating an unchanged navigation or dismissal', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner])));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([banner])));
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ ...banner, presentationHash: 'changed' }, secondBanner])),
    );
    render(SiteBannerRegion);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    await navigation.callback?.();
    await waitFor(() =>
      expect(status).toHaveTextContent('1 new or updated site announcement. Maintenance'),
    );
    const changes = vi.fn();
    const observer = new MutationObserver(changes);
    observer.observe(status, { childList: true, characterData: true, subtree: true });

    await navigation.callback?.();
    expect(changes).not.toHaveBeenCalled();
    await navigation.callback?.();
    await waitFor(() =>
      expect(status).toHaveTextContent(
        '2 new or updated site announcements. Maintenance. Service update',
      ),
    );
    changes.mockClear();
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss Maintenance' }));
    expect(changes).not.toHaveBeenCalled();
    observer.disconnect();
  });

  it('remembers announcements across route hide and return, while announcing a changed version', async () => {
    const targeted = { ...banner, pageTargets: [{ kind: 'EXACT', path: '/help' }] };
    fetchMock.mockImplementation(async () => new Response(JSON.stringify([targeted])));
    render(SiteBannerRegion);
    const navigate = (path: string) =>
      navigation.callback?.({ to: { url: new URL(`https://example.org${path}`) } });
    await navigate('/help');
    const status = screen.getByRole('status');
    await waitFor(() => expect(status).toHaveTextContent('Maintenance'));
    const changes = vi.fn();
    const observer = new MutationObserver(changes);
    observer.observe(status, { childList: true, characterData: true, subtree: true });

    await navigate('/elsewhere');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await navigate('/help');
    expect(screen.getByRole('article', { name: 'Maintenance' })).toBeInTheDocument();
    expect(changes).not.toHaveBeenCalled();

    fetchMock.mockImplementation(
      async () =>
        new Response(
          JSON.stringify([
            { ...targeted, presentationHash: 'revised', title: 'Revised maintenance' },
          ]),
        ),
    );
    await navigate('/help');
    await waitFor(() => expect(status).toHaveTextContent('Revised maintenance'));
    expect(changes).toHaveBeenCalled();
    observer.disconnect();
  });

  it('leaves the persistent fallback empty on pages without banners', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([])));
    const { container } = render(SiteBannerRegion);
    const fallback = container.querySelector('[tabindex="-1"]');
    expect(fallback?.textContent).toBe('');
    await navigation.callback?.();
    expect(fallback?.textContent).toBe('');
    expect(screen.queryByText('End of site announcements.')).not.toBeInTheDocument();
  });

  it('clears the dismissal fallback message when focus leaves it', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([banner])));
    render(SiteBannerRegion);
    await navigation.callback?.();
    const button = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    button.focus();
    await fireEvent.click(button, { detail: 0 });
    const fallback = screen.getByText('End of site announcements.');
    await waitFor(() => expect(fallback).toHaveFocus());
    fallback.blur();
    await waitFor(() => expect(fallback.textContent).toBe(''));
  });

  it('clears the dismissal fallback message on subsequent navigation', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify([banner])));
    render(SiteBannerRegion);
    await navigation.callback?.();
    const button = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    button.focus();
    await fireEvent.click(button, { detail: 0 });
    await waitFor(() => expect(screen.getByText('End of site announcements.')).toHaveFocus());
    await navigation.callback?.({ to: { url: new URL('https://example.org/elsewhere') } });
    expect(screen.queryByText('End of site announcements.')).not.toBeInTheDocument();
  });

  it('announces only visible audience and page targets', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          banner,
          { ...secondBanner, audience: 'SIGNED_IN' },
          {
            ...secondBanner,
            uuid: 'another-page',
            pageTargets: [{ kind: 'EXACT', path: '/elsewhere' }],
          },
        ]),
      ),
    );
    render(SiteBannerRegion);
    await navigation.callback?.({ to: { url: new URL('https://example.org/help') } });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        '1 new or updated site announcement. Maintenance',
      ),
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('Service update');
  });

  it('uses distinct short text names for untitled banners without script content', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            ...banner,
            title: null,
            htmlContent: '<p>Maintenance <strong>details</strong></p><script>secret</script>',
          },
          { ...secondBanner, title: null, htmlContent: '<p>Maintenance details</p>' },
        ]),
      ),
    );
    render(SiteBannerRegion);
    await navigation.callback?.();
    expect(
      screen.getByRole('article', { name: 'Site announcement 1: Maintenance details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: 'Site announcement 2: Maintenance details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Dismiss Site announcement 2: Maintenance details' }),
    ).toBeInTheDocument();
    await fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss Site announcement 1: Maintenance details' }),
    );
    expect(
      screen.getByRole('article', { name: 'Site announcement 2: Maintenance details' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Dismiss Site announcement 2: Maintenance details' }),
    ).toBeInTheDocument();
  });
});

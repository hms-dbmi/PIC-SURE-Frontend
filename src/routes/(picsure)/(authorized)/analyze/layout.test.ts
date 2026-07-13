import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';
import { BDCPrivileges, PicsurePrivileges } from '$lib/models/Privilege';

const store = vi.hoisted(() => ({ value: {} as { privileges?: string[] } }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/User', () => ({
  user: {
    subscribe: (fn: (v: unknown) => void) => {
      fn(store.value);
      return () => {};
    },
  },
}));

import { load } from './+layout';

function isRedirect(e: unknown): e is Redirect {
  return typeof e === 'object' && e !== null && 'status' in e && 'location' in e;
}

async function captureRedirect(path: string): Promise<Redirect | null> {
  try {
    await load({
      url: new URL(`http://localhost${path}`),
      parent: vi.fn().mockResolvedValue({}),
    } as unknown as Parameters<typeof load>[0]);
    return null;
  } catch (e) {
    if (isRedirect(e)) return e;
    throw e;
  }
}

beforeEach(() => {
  store.value = {};
});

describe('analyze layout guard', () => {
  // Each arm is asserted on its own. Testing only one leaves the other free to hold a name that
  // does not match what PSAMA sends, which is exactly how AUTHORIZED_ACCESS came to be broken.
  it('admits a user holding only API_ACCESS', async () => {
    store.value = { privileges: [PicsurePrivileges.API_ACCESS] };

    expect(await captureRedirect('/analyze/api')).toBeNull();
  });

  it('admits a user holding only AUTHORIZED_ACCESS', async () => {
    store.value = { privileges: [BDCPrivileges.AUTHORIZED_ACCESS] };

    expect(await captureRedirect('/analyze/api')).toBeNull();
  });

  it('redirects to / when the user holds neither', async () => {
    store.value = { privileges: ['MANAGED_PRIV_OPEN_ACCESS'] };

    const result = await captureRedirect('/analyze/api');

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });

  it('redirects to / when the user store is empty', async () => {
    const result = await captureRedirect('/analyze/api');

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });
});

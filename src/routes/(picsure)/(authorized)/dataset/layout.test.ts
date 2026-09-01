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
    await load({ url: new URL(`http://localhost${path}`) } as Parameters<typeof load>[0]);
    return null;
  } catch (e) {
    if (isRedirect(e)) return e;
    throw e;
  }
}

beforeEach(() => {
  store.value = {};
});

describe('dataset layout guard', () => {
  // NAMED_DATASET is the open-source name, MANUAL_PRIV_NAMED_DATASET the BDC one. Both arms are
  // asserted separately so a mismatch on either is visible.
  it('admits a user holding only the open-source NAMED_DATASET', async () => {
    store.value = { privileges: [PicsurePrivileges.NAMED_DATASET] };

    expect(await captureRedirect('/dataset')).toBeNull();
  });

  it('admits a user holding only the BDC MANUAL_PRIV_NAMED_DATASET', async () => {
    store.value = { privileges: [BDCPrivileges.NAMED_DATASET] };

    expect(await captureRedirect('/dataset')).toBeNull();
  });

  it('redirects to / when the user holds neither', async () => {
    store.value = { privileges: [PicsurePrivileges.QUERY] };

    const result = await captureRedirect('/dataset');

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });

  // /dataset/request returns before the privilege check so a user without dataset access can
  // still ask for it.
  it('lets an unprivileged user reach /dataset/request', async () => {
    expect(await captureRedirect('/dataset/request')).toBeNull();
  });
});

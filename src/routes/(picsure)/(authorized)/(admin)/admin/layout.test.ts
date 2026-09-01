import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';
import { PicsurePrivileges } from '$lib/models/Privilege';

const store = vi.hoisted(() => ({ value: {} as { privileges?: string[] }, topAdmin: false }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/User', () => ({
  user: {
    subscribe: (fn: (v: unknown) => void) => {
      fn(store.value);
      return () => {};
    },
  },
  isTopAdmin: {
    subscribe: (fn: (v: unknown) => void) => {
      fn(store.topAdmin);
      return () => {};
    },
  },
}));

import { load } from './+layout';

function isRedirect(e: unknown): e is Redirect {
  return typeof e === 'object' && e !== null && 'status' in e && 'location' in e;
}

async function captureRedirect(): Promise<Redirect | null> {
  try {
    await load({} as Parameters<typeof load>[0]);
    return null;
  } catch (e) {
    if (isRedirect(e)) return e;
    throw e;
  }
}

beforeEach(() => {
  store.value = {};
  store.topAdmin = false;
});

describe('admin layout guard', () => {
  it('admits a top admin', async () => {
    store.topAdmin = true;

    expect(await captureRedirect()).toBeNull();
  });

  it('admits a user holding only the ADMIN privilege', async () => {
    store.value = { privileges: [PicsurePrivileges.ADMIN] };

    expect(await captureRedirect()).toBeNull();
  });

  it('redirects to / for a user who is neither', async () => {
    store.value = { privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.API_ACCESS] };

    const result = await captureRedirect();

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });
});

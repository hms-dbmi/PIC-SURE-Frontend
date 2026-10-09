// @vitest-environment happy-dom
// Mirrors the browser run: kit's client redirect() reads window.location.origin.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';
import { PicsurePrivileges } from '#lib/models/Privilege.ts';

const store = vi.hoisted(() => ({ value: {} as { privileges?: string[] }, topAdmin: false }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/stores/User.ts', () => ({
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

async function captureRedirect(parent = async () => ({})): Promise<Redirect | null> {
  try {
    await load({ parent } as unknown as Parameters<typeof load>[0]);
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

  it('checks privileges only after the parent layout has loaded the user', async () => {
    // A fresh tab has a token but no user until the authorized layout hydrates it.
    const parent = async () => {
      store.value = { privileges: [PicsurePrivileges.ADMIN] };
      return {};
    };

    expect(await captureRedirect(parent)).toBeNull();
  });

  it('redirects to / for a user who is neither', async () => {
    store.value = { privileges: [PicsurePrivileges.QUERY, PicsurePrivileges.API_ACCESS] };

    const result = await captureRedirect();

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/');
  });
});

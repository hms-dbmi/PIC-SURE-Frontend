// @vitest-environment happy-dom
// Mirrors the browser run: kit's client redirect() reads window.location.origin.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redirect } from '@sveltejs/kit';

const store = vi.hoisted(() => ({ topAdmin: false }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/stores/User.ts', () => ({
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
  store.topAdmin = false;
});

describe('access control route guard', () => {
  it('admits a top admin', async () => {
    store.topAdmin = true;

    expect(await captureRedirect()).toBeNull();
  });

  it('checks privileges only after the parent layout has loaded the user', async () => {
    // A fresh tab has a token but no user until the authorized layout hydrates it.
    const parent = async () => {
      store.topAdmin = true;
      return {};
    };

    expect(await captureRedirect(parent)).toBeNull();
  });

  it('sends a plain admin back to the configuration page', async () => {
    const result = await captureRedirect();

    expect(result).not.toBeNull();
    expect(result!.location).toBe('/admin/configuration');
  });
});
